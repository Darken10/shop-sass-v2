import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Globe,
    Package,
    Shield,
    ShoppingCart,
    Store,
    Truck,
    Users,
    Zap,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, login, register } from '@/routes';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="FasoTrade — Plateforme de gestion commerciale">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-white dark:bg-gray-950">
                {/* ── Navigation ──────────────────────────────── */}
                <nav className="fixed top-0 z-50 w-full border-b border-purple-100/60 bg-white/80 backdrop-blur-lg dark:border-purple-900/30 dark:bg-gray-950/80">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <Link href="/" className="flex items-center gap-2">
                            <AppLogoIcon className="size-8" />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                                FasoTrade
                            </span>
                        </Link>

                        <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex dark:text-gray-300">
                            <a href="#features" className="transition hover:text-purple-600 dark:hover:text-purple-400">Fonctionnalités</a>
                            <a href="#modules" className="transition hover:text-purple-600 dark:hover:text-purple-400">Modules</a>
                            <a href="#pricing" className="transition hover:text-purple-600 dark:hover:text-purple-400">Tarifs</a>
                            <a href="#contact" className="transition hover:text-purple-600 dark:hover:text-purple-400">Contact</a>
                        </div>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link href={dashboard()}>
                                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
                                        Tableau de bord
                                        <ArrowRight className="ml-2 size-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href={login()}>
                                        <Button variant="ghost" className="text-gray-600 hover:text-purple-700 dark:text-gray-300">
                                            Connexion
                                        </Button>
                                    </Link>
                                    {canRegister && (
                                        <Link href={register()}>
                                            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
                                                S'inscrire
                                            </Button>
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* ── Hero Section ────────────────────────────── */}
                <section className="relative overflow-hidden pt-16">
                    {/* Background decoration */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-purple-200/40 blur-3xl dark:bg-purple-900/20" />
                        <div className="absolute top-20 -left-40 h-[500px] w-[500px] rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-900/15" />
                        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-200/20 blur-3xl dark:bg-fuchsia-900/10" />
                    </div>

                    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
                            <Zap className="size-4" />
                            La plateforme commerciale #1 au Burkina Faso
                        </div>

                        <h1 className="mb-6 max-w-4xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl dark:text-white">
                            Gérez votre{' '}
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                                commerce
                            </span>{' '}
                            en toute simplicité
                        </h1>

                        <p className="mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl dark:text-gray-400">
                            FasoTrade centralise vos points de vente, votre logistique et vos stocks
                            dans une plateforme unique, intuitive et puissante. Prenez le contrôle de
                            votre activité commerciale dès aujourd'hui.
                        </p>

                        <div className="flex flex-col items-center gap-4 sm:flex-row">
                            {auth.user ? (
                                <Link href={dashboard()}>
                                    <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 text-base text-white shadow-lg shadow-purple-500/25 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:shadow-purple-500/30">
                                        Accéder au tableau de bord
                                        <ArrowRight className="ml-2 size-5" />
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href={register()}>
                                        <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 text-base text-white shadow-lg shadow-purple-500/25 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:shadow-purple-500/30">
                                            Commencer gratuitement
                                            <ArrowRight className="ml-2 size-5" />
                                        </Button>
                                    </Link>
                                    <Link href="#features">
                                        <Button size="lg" variant="outline" className="border-purple-200 px-8 text-base text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/50">
                                            Découvrir la plateforme
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Stats bar */}
                        <div className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-8 rounded-2xl border border-purple-100 bg-white/70 p-8 shadow-lg backdrop-blur-sm sm:grid-cols-4 dark:border-purple-900/30 dark:bg-gray-900/50">
                            {[
                                { value: '500+', label: 'Entreprises' },
                                { value: '50K+', label: 'Transactions/mois' },
                                { value: '99.9%', label: 'Disponibilité' },
                                { value: '24/7', label: 'Support' },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent sm:text-3xl">
                                        {stat.value}
                                    </div>
                                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Features Section ────────────────────────── */}
                <section id="features" className="relative bg-gray-50/50 py-24 dark:bg-gray-900/50">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
                                Tout ce dont vous avez besoin
                            </h2>
                            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                                Une suite complète d'outils pour gérer efficacement votre activité
                                commerciale de bout en bout.
                            </p>
                        </div>

                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: ShoppingCart,
                                    title: 'Point de Vente (POS)',
                                    description: 'Caisse intuitive avec gestion des sessions, promotions, crédits clients et scan de codes-barres.',
                                    gradient: 'from-purple-500 to-blue-500',
                                },
                                {
                                    icon: Package,
                                    title: 'Gestion des Produits',
                                    description: 'Catalogue complet avec catégories, unités, statuts et suivi des stocks en temps réel.',
                                    gradient: 'from-blue-500 to-cyan-500',
                                },
                                {
                                    icon: Truck,
                                    title: 'Logistique',
                                    description: 'Gestion des fournisseurs, approvisionnements, transferts et suivi des véhicules de livraison.',
                                    gradient: 'from-fuchsia-500 to-purple-500',
                                },
                                {
                                    icon: Store,
                                    title: 'Multi-Boutiques',
                                    description: 'Gérez plusieurs points de vente et entrepôts depuis une interface centralisée.',
                                    gradient: 'from-violet-500 to-indigo-500',
                                },
                                {
                                    icon: Users,
                                    title: 'Gestion des Clients',
                                    description: 'Suivi clients avec historique d\'achats, crédits et fidélisation intégrée.',
                                    gradient: 'from-indigo-500 to-blue-500',
                                },
                                {
                                    icon: BarChart3,
                                    title: 'Rapports & Analyses',
                                    description: 'Tableaux de bord en temps réel avec KPIs, graphiques de ventes et alertes de stock.',
                                    gradient: 'from-purple-600 to-fuchsia-500',
                                },
                            ].map((feature) => (
                                <div
                                    key={feature.title}
                                    className="group relative rounded-2xl border border-gray-200/60 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-800"
                                >
                                    <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-3 text-white shadow-md`}>
                                        <feature.icon className="size-6" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Modules Section ─────────────────────────── */}
                <section id="modules" className="py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
                                Des modules puissants et intégrés
                            </h2>
                            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                                Chaque module est conçu pour fonctionner parfaitement avec les autres,
                                offrant une expérience fluide et unifiée.
                            </p>
                        </div>

                        {/* Module 1: POS */}
                        <div className="mb-20 flex flex-col items-center gap-12 lg:flex-row">
                            <div className="flex-1">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                                    <ShoppingCart className="size-4" />
                                    Point de Vente
                                </div>
                                <h3 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                                    Un POS taillé pour la performance
                                </h3>
                                <p className="mb-6 text-gray-600 dark:text-gray-400">
                                    Interface de caisse rapide et intuitive avec scan de codes-barres,
                                    gestion des promotions, paiements multiples et suivi des crédits clients.
                                    Parfait pour le commerce de détail et la distribution.
                                </p>
                                <ul className="space-y-3">
                                    {['Sessions de caisse sécurisées', 'Scanner de codes-barres intégré', 'Promotions & remises automatiques', 'Paiements mixtes (espèces, mobile)'].map((item) => (
                                        <li key={item} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                                                <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex-1">
                                <div className="overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-blue-50 p-8 shadow-xl dark:border-purple-900/30 dark:from-purple-950/30 dark:to-blue-950/30">
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { icon: ShoppingCart, label: 'Ventes aujourd\'hui', value: '127' },
                                            { icon: Users, label: 'Clients servis', value: '89' },
                                            { icon: BarChart3, label: 'CA du jour', value: '2.4M FCFA' },
                                            { icon: Package, label: 'Articles en stock', value: '1,204' },
                                        ].map((item) => (
                                            <div key={item.label} className="rounded-xl bg-white/80 p-4 shadow-sm dark:bg-gray-900/60">
                                                <item.icon className="mb-2 size-5 text-purple-600 dark:text-purple-400" />
                                                <div className="text-xl font-bold text-gray-900 dark:text-white">{item.value}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Module 2: Logistics */}
                        <div className="flex flex-col items-center gap-12 lg:flex-row-reverse">
                            <div className="flex-1">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                    <Truck className="size-4" />
                                    Logistique
                                </div>
                                <h3 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                                    Chaîne logistique maîtrisée
                                </h3>
                                <p className="mb-6 text-gray-600 dark:text-gray-400">
                                    Gérez vos fournisseurs, vos approvisionnements et vos transferts entre
                                    entrepôts et boutiques. Suivez vos véhicules et optimisez vos livraisons
                                    pour une distribution sans faille.
                                </p>
                                <ul className="space-y-3">
                                    {['Gestion des fournisseurs & commandes', 'Transferts inter-entrepôts', 'Suivi des véhicules & carburant', 'Mouvements de stock traçables'].map((item) => (
                                        <li key={item} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
                                                <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex-1">
                                <div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 shadow-xl dark:border-blue-900/30 dark:from-blue-950/30 dark:to-indigo-950/30">
                                    <div className="space-y-4">
                                        {[
                                            { status: 'Livré', from: 'Entrepôt Central', to: 'Boutique Ouaga 1', time: 'Il y a 2h' },
                                            { status: 'En transit', from: 'Fournisseur Abidjan', to: 'Entrepôt Central', time: 'Il y a 5h' },
                                            { status: 'En attente', from: 'Entrepôt Central', to: 'Boutique Bobo', time: 'Demain' },
                                        ].map((transfer, i) => (
                                            <div key={i} className="flex items-center justify-between rounded-xl bg-white/80 p-4 shadow-sm dark:bg-gray-900/60">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-2 rounded-full ${transfer.status === 'Livré' ? 'bg-green-500' : transfer.status === 'En transit' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{transfer.from} → {transfer.to}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{transfer.time}</div>
                                                    </div>
                                                </div>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${transfer.status === 'Livré' ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' : transfer.status === 'En transit' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                    {transfer.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Why FasoTrade Section ───────────────────── */}
                <section className="relative bg-gradient-to-br from-purple-900 via-violet-800 to-blue-900 py-24 text-white">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-3xl" />
                    </div>

                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                                Pourquoi choisir FasoTrade ?
                            </h2>
                            <p className="mx-auto max-w-2xl text-lg text-purple-200">
                                Conçu spécifiquement pour les réalités du commerce en Afrique de l'Ouest,
                                FasoTrade s'adapte à vos besoins.
                            </p>
                        </div>

                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { icon: Globe, title: 'Multi-devises', description: 'Support FCFA et autres devises régionales' },
                                { icon: Shield, title: 'Sécurisé', description: 'Données protégées avec rôles et permissions' },
                                { icon: Zap, title: 'Rapide', description: 'Interface optimisée même avec une connexion lente' },
                                { icon: Users, title: 'Multi-utilisateurs', description: 'Collaboration en équipe avec des rôles dédiés' },
                            ].map((item) => (
                                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10">
                                    <item.icon className="mb-4 size-8 text-purple-300" />
                                    <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                                    <p className="text-sm text-purple-200">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Pricing Section ─────────────────────────── */}
                <section id="pricing" className="py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
                                Des tarifs adaptés à votre activité
                            </h2>
                            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                                Commencez gratuitement et évoluez au rythme de votre croissance.
                            </p>
                        </div>

                        <div className="grid gap-8 lg:grid-cols-3">
                            {/* Free plan */}
                            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="mb-6">
                                    <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Starter</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Pour démarrer votre activité</p>
                                </div>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">Gratuit</span>
                                </div>
                                <ul className="mb-8 space-y-3">
                                    {['1 boutique', '1 utilisateur', 'POS basique', 'Rapports essentiels', 'Support email'].map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <svg className="size-4 shrink-0 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link href={register()} className="block">
                                    <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300">
                                        Commencer
                                    </Button>
                                </Link>
                            </div>

                            {/* Pro plan */}
                            <div className="relative rounded-2xl border-2 border-purple-500 bg-white p-8 shadow-xl dark:bg-gray-900">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1 text-xs font-semibold text-white">
                                    Populaire
                                </div>
                                <div className="mb-6">
                                    <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Pro</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Pour les entreprises en croissance</p>
                                </div>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">25,000</span>
                                    <span className="text-lg text-gray-500 dark:text-gray-400"> FCFA/mois</span>
                                </div>
                                <ul className="mb-8 space-y-3">
                                    {['5 boutiques', '10 utilisateurs', 'POS complet', 'Logistique & transferts', 'Rapports avancés', 'Support prioritaire'].map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <svg className="size-4 shrink-0 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link href={register()} className="block">
                                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
                                        Essai gratuit 14 jours
                                    </Button>
                                </Link>
                            </div>

                            {/* Enterprise plan */}
                            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="mb-6">
                                    <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Enterprise</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Pour les grandes structures</p>
                                </div>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">Sur mesure</span>
                                </div>
                                <ul className="mb-8 space-y-3">
                                    {['Boutiques illimitées', 'Utilisateurs illimités', 'Tous les modules', 'API & Intégrations', 'Formation dédiée', 'Support 24/7'].map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <svg className="size-4 shrink-0 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300">
                                    Nous contacter
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CTA Section ─────────────────────────────── */}
                <section id="contact" className="py-24">
                    <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 p-12 shadow-2xl sm:p-16">
                            <AppLogoIcon className="mx-auto mb-6 size-16 drop-shadow-lg" />
                            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                                Prêt à transformer votre commerce ?
                            </h2>
                            <p className="mb-8 text-lg text-purple-100">
                                Rejoignez les centaines d'entreprises qui font confiance à FasoTrade
                                pour gérer leur activité au quotidien.
                            </p>
                            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                                <Link href={register()}>
                                    <Button size="lg" className="bg-white px-8 text-base text-purple-700 shadow-lg hover:bg-purple-50">
                                        Créer un compte gratuit
                                        <ArrowRight className="ml-2 size-5" />
                                    </Button>
                                </Link>
                                <Button size="lg" variant="outline" className="border-white/30 px-8 text-base text-white hover:bg-white/10">
                                    Demander une démo
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Footer ──────────────────────────────────── */}
                <footer className="border-t border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-gray-950">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                            <div className="flex items-center gap-2">
                                <AppLogoIcon className="size-7" />
                                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                                    FasoTrade
                                </span>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                                <a href="#features" className="transition hover:text-purple-600">Fonctionnalités</a>
                                <a href="#modules" className="transition hover:text-purple-600">Modules</a>
                                <a href="#pricing" className="transition hover:text-purple-600">Tarifs</a>
                                <a href="#contact" className="transition hover:text-purple-600">Contact</a>
                            </div>

                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                &copy; {new Date().getFullYear()} FasoTrade. Tous droits réservés.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
