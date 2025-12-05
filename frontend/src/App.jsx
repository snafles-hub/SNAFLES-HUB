import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';

const apiHost = import.meta.env.VITE_API_URL || '';

const Shell = ({ children }) => (
  <div className="min-h-screen bg-gradient-app text-slate-900">
    <header className="border-b border-indigo-100/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl font-semibold tracking-tight text-slate-900">
          Snafleshub Hub
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold text-indigo-700">
          <Link to="/vendors" className="hover:text-indigo-900">Vendors</Link>
          <Link to="/support" className="hover:text-indigo-900">Support</Link>
          <a href="#apis" className="hover:text-indigo-900">APIs</a>
        </nav>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    <footer className="border-t border-indigo-100/70 bg-white/80 py-6 text-center text-sm text-indigo-700">
      Snafleshub central community hub — all vendors, support, and APIs in one place.
    </footer>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch(`${apiHost}/api/vendors?verified=true&limit=12`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setVendors(data?.vendors || []);
        }
      })
      .catch(() => {})
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = vendors.filter((v) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return v.name?.toLowerCase().includes(q) || v.slug?.toLowerCase().includes(q) || v.location?.city?.toLowerCase?.()?.includes(q);
  });

  return (
    <Shell>
      <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="space-y-6">
          <p className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">Central Hub</p>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900">
            All of Snafleshub, in one place. Vendor homes, support, and APIs — zero e‑commerce clutter.
          </h1>
          <p className="text-lg text-slate-600">
            Snafleshub Hub is the command center for the ecosystem. Discover verified vendors, reach support, and jump into our APIs from a single home.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => document.getElementById('vendor-search')?.focus()}
              className="rounded-md bg-gradient-to-r from-blue-600 via-indigo-700 to-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-slate-950"
            >
              Browse vendors
            </button>
            <a
              href="#support"
              className="rounded-md border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-800 hover:border-indigo-300 hover:bg-indigo-50"
            >
              Visit support hub
            </a>
            <a
              href="#apis"
              className="rounded-md border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-800 hover:border-purple-300 hover:bg-purple-50"
            >
              View APIs
            </a>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm">
            <label htmlFor="vendor-search" className="text-sm font-semibold text-slate-700">
              Search vendor directory
            </label>
            <input
              id="vendor-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, slug, or city"
              className="mt-2 w-full rounded-md border border-indigo-100 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.12),transparent_35%),radial-gradient(circle_at_70%_40%,rgba(249,115,22,0.12),transparent_30%)]" />
          <div className="relative space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Hub checklist</p>
            <ul className="space-y-3 text-sm text-slate-700">
              <li>✅ Verified vendor directory with personalized subdomains</li>
              <li>✅ Support hub for vendors and buyers</li>
              <li>✅ API links for sh-vendor and SHStore integrations</li>
              <li>✅ Purely community and content — no checkout flows</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="mt-12 space-y-6" id="vendors">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Featured vendors</h2>
          {loading && <span className="text-sm text-slate-500">Loading…</span>}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vendor) => (
            <div key={vendor._id} className="group rounded-xl border border-indigo-100 bg-white p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition">
              <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-indigo-600">
                <span>{vendor.hub || 'snafleshub'}</span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">{vendor.location?.city || vendor.location}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{vendor.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{vendor.tagline || vendor.description || 'Vendor on Snafleshub'}</p>
              <button
                onClick={() => navigate(`/vendor/${vendor.slug || vendor._id}`)}
                className="mt-4 text-sm font-semibold text-orange-600 hover:text-orange-700"
              >
                View profile →
              </button>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              No vendors found. Try a different search.
            </div>
          )}
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2" id="support">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Support hub</h3>
          <p className="mt-2 text-sm text-slate-600">Help for vendors and buyers in one place.</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>• Vendor onboarding & verification</li>
            <li>• Domain and subdomain setup</li>
            <li>• SHStore app assistance</li>
            <li>• Contact Snafleshub LLP support</li>
          </ul>
          <Link to="/support" className="mt-4 inline-block text-sm font-semibold text-orange-600 hover:text-orange-700">
            Open support hub →
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" id="apis">
          <h3 className="text-xl font-semibold text-slate-900">API & integration</h3>
          <p className="mt-2 text-sm text-slate-600">Connect sh-vendor, SHStore, or your own tools.</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>• Vendor profile API (slug-based domain resolution)</li>
            <li>• Public store info API for SHStore</li>
            <li>• Subdomain/path-based routing middleware</li>
            <li>• More endpoints coming for community interactions</li>
          </ul>
          <a href="mailto:api@snafleshub.com" className="mt-4 inline-block text-sm font-semibold text-orange-600 hover:text-orange-700">
            Request API keys →
          </a>
        </div>
      </section>
    </Shell>
  );
};

const VendorPage = () => {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiHost}/api/store/${slug}/info`)
      .then((res) => res.json())
      .then((data) => setProfile(data?.store || null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Shell><p className="text-slate-600">Loading vendor profile…</p></Shell>;
  if (!profile) return <Shell><p className="text-slate-600">Vendor not found.</p></Shell>;

  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-wide text-indigo-600">{profile.domainSub}</p>
          <h1 className="text-3xl font-semibold text-slate-900">{profile.name}</h1>
          {profile.tagline && <p className="text-lg text-slate-700">{profile.tagline}</p>}
          {profile.about && <p className="text-slate-600">{profile.about}</p>}
          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
            {profile.location?.city && <span className="rounded-full bg-indigo-50 px-3 py-1">📍 {profile.location.city}</span>}
            {typeof profile.followersCount === 'number' && <span className="rounded-full bg-purple-50 px-3 py-1">👥 {profile.followersCount} followers</span>}
          </div>
          {profile.socialLinks && (
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-indigo-700">
              {profile.socialLinks.website && <a href={profile.socialLinks.website} className="hover:text-orange-700" target="_blank" rel="noreferrer">Website</a>}
              {profile.socialLinks.instagram && <a href={profile.socialLinks.instagram} className="hover:text-orange-700" target="_blank" rel="noreferrer">Instagram</a>}
              {profile.socialLinks.youtube && <a href={profile.socialLinks.youtube} className="hover:text-orange-700" target="_blank" rel="noreferrer">YouTube</a>}
              {profile.socialLinks.facebook && <a href={profile.socialLinks.facebook} className="hover:text-orange-700" target="_blank" rel="noreferrer">Facebook</a>}
              {profile.socialLinks.twitter && <a href={profile.socialLinks.twitter} className="hover:text-orange-700" target="_blank" rel="noreferrer">Twitter</a>}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Highlights</h2>
          <div className="mt-4 space-y-4">
            {(profile.highlights || []).map((item, idx) => (
              <div key={idx} className="rounded-lg border border-indigo-50 bg-indigo-50/60 p-3">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.body}</p>
                {item.ctaUrl && (
                  <a href={item.ctaUrl} className="text-sm font-semibold text-orange-600 hover:text-orange-700" target="_blank" rel="noreferrer">
                    {item.ctaLabel || 'Learn more'} →
                  </a>
                )}
              </div>
            ))}
            {(profile.highlights || []).length === 0 && (
              <p className="text-sm text-slate-500">This vendor hasn't added highlights yet.</p>
            )}
          </div>
        </div>
      </div>
      {profile.showcaseMedia?.length > 0 && (
        <section className="mt-12 space-y-4">
          <h3 className="text-xl font-semibold text-slate-900">Showcase</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.showcaseMedia.map((media, idx) => (
              <div key={idx} className="overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm">
                <div className="aspect-video w-full bg-indigo-50">
                  {media.type === 'video' ? (
                    <video src={media.url} controls className="h-full w-full object-cover" />
                  ) : (
                    <img src={media.url} alt={media.title || 'Showcase item'} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-slate-900">{media.title}</p>
                  <p className="text-sm text-slate-600">{media.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
};

const VendorsListPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiHost}/api/vendors?verified=true&limit=50`)
      .then((res) => res.json())
      .then((data) => setVendors(data?.vendors || []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Directory</p>
          <h1 className="text-3xl font-semibold text-slate-900">All vendors</h1>
        </div>
        {loading && <span className="text-sm text-slate-500">Loading…</span>}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <div key={vendor._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{vendor.hub || 'snafleshub'}</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{vendor.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{vendor.tagline || vendor.description || 'Vendor on Snafleshub'}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              {vendor.location?.city && <span>📍 {vendor.location.city}</span>}
              {vendor.status && <span className="rounded-full bg-slate-100 px-2 py-0.5">{vendor.status}</span>}
            </div>
            <Link to={`/vendor/${vendor.slug || vendor._id}`} className="mt-4 inline-block text-sm font-semibold text-orange-600 hover:text-orange-700">
              View profile →
            </Link>
          </div>
        ))}
        {!loading && vendors.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No vendors yet. Check back soon.
          </div>
        )}
      </div>
    </Shell>
  );
};

const SupportPage = () => (
  <Shell>
    <div className="space-y-6">
      <p className="text-xs uppercase tracking-wide text-slate-500">Support</p>
      <h1 className="text-3xl font-semibold text-slate-900">Snafleshub Support Hub</h1>
      <p className="text-lg text-slate-600">
        Guidance for vendors, buyers, and integrators. No commerce here—just help and resources.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Vendor onboarding', body: 'Register via sh-vendor, submit verification, and claim your domain.' },
          { title: 'Domains & routing', body: 'Understand subdomains, path routing, and DNS tips for your vendor home.' },
          { title: 'Profile content', body: 'Add bio, media, links, and highlights to personalize your hub page.' },
          { title: 'SHStore app', body: 'How the Android app reads vendor profiles and store info APIs.' },
          { title: 'API access', body: 'Request API keys and integrate vendor lookup or store info.' },
          { title: 'Contact support', body: 'Email hello@snafleshub.com for verification or domain questions.' },
        ].map((card, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{card.title}</p>
            <p className="mt-2 text-sm text-slate-600">{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  </Shell>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vendors" element={<VendorsListPage />} />
        <Route path="/vendor/:slug" element={<VendorPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="*" element={<Shell><p className="text-slate-600">Page not found.</p></Shell>} />
      </Routes>
    </Router>
  );
}

export default App;
