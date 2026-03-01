<?php

namespace App\Console\Commands;

use App\Models\Catalog\CatalogProduct;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use OpenFoodFacts\Exception\BadRequestException;
use OpenFoodFacts\Exceptions\Exception;
use OpenFoodFacts\Laravel\Facades\OpenFoodFacts;

class ImportCatalogProducts extends Command
{
    protected $signature = 'catalog:import
                            {--limit=50 : Nombre maximum de produits à importer}
                            {--terms=Coca Cola Zero,Sprite,Apple Juice : Termes de recherche spécifiques}
                            {--delay=1 : Délai en secondes entre les recherches (respect du rate limit)}';

    protected $description = 'Importe des produits depuis Open Food Facts dans le catalogue global';

    private int $imported = 0;

    private int $skipped = 0;

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $termsInput = (string) $this->option('terms');
        $delay = (int) $this->option('delay');

        $terms = array_map('trim', explode(',', $termsInput));

        $this->info("Démarrage de l'import depuis Open Food Facts (limite globale : {$limit} produits)…");
        $this->info('Termes de recherche : '.implode(', ', $terms));
        $this->newLine();

        foreach ($terms as $term) {
            if ($this->imported >= $limit) {
                break;
            }

            $remaining = $limit - $this->imported;
            $this->line("→ Recherche pour '{$term}' ({$remaining} produits restants)…");

            try {
                $products = OpenFoodFacts::find($term);

                if (empty($products)) {
                    $this->warn("  Aucun résultat pour '{$term}'");
                    sleep($delay);

                    continue;
                }

                foreach ($products as $item) {
                    if ($this->imported >= $limit) {
                        break;
                    }

                    $this->processProduct($item);
                }

                $this->info("  ✓ {$term} : {$this->imported} importé(s), {$this->skipped} ignoré(s)");

            } catch (BadRequestException $e) {
                $msg = $e->getMessage();
                if (str_contains($msg, '504') || str_contains($msg, 'Gateway')) {
                    $this->warn('  ⚠ Serveur Open Food Facts indisponible (erreur 504) — réessayez plus tard');
                } elseif (str_contains($msg, '429')) {
                    $this->warn('  ⚠ Trop de requêtes — augmentez le délai avec --delay=5');
                } else {
                    $this->error("  ✗ Erreur serveur : {$msg}");
                }
                Log::error('catalog:import server error', [
                    'term' => $term,
                    'message' => $msg,
                ]);
            } catch (Exception $e) {
                $msg = $e->getMessage();
                if (str_contains($msg, 'results found')) {
                    $this->error("  ✗ Trop de résultats pour '{$term}' — affinez votre recherche");
                } else {
                    $this->error("  ✗ Erreur pour '{$term}' : {$msg}");
                }
                Log::error('catalog:import search error', [
                    'term' => $term,
                    'message' => $e->getMessage(),
                ]);
            }

            sleep($delay);
        }

        $this->newLine();
        $this->table(
            ['Importés', 'Ignorés (doublons ou incomplets)', 'Total'],
            [[$this->imported, $this->skipped, $this->imported + $this->skipped]]
        );

        $this->info("Import terminé. {$this->imported} produit(s) ajouté(s) au catalogue.");

        return self::SUCCESS;
    }

    /**
     * Traite un produit reçu de l'API et le crée s'il n'existe pas.
     *
     * @param  array<string, mixed>  $item
     */
    private function processProduct(array $item): void
    {
        $barcode = trim($item['code'] ?? '');
        $name = trim($item['product_name'] ?? '');

        if (empty($barcode) || empty($name)) {
            $this->skipped++;

            return;
        }

        if (CatalogProduct::where('barcode', $barcode)->exists()) {
            $this->skipped++;

            return;
        }

        $categories = $item['categories_tags'] ?? [];
        $category = ! empty($categories) ? str_replace('en:', '', $categories[0]) : null;

        CatalogProduct::create([
            'barcode' => $barcode,
            'name' => $name,
            'brand' => ! empty($item['brands']) ? $item['brands'] : null,
            'description' => ! empty($item['ingredients_text']) ? $item['ingredients_text'] : null,
            'image_url' => ! empty($item['image_url']) ? $item['image_url'] : null,
            'category' => $category,
            'source' => 'open_food_facts',
        ]);

        $this->imported++;
    }
}
