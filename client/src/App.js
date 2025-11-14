import { useState, useEffect } from "react";
import api from "./api";
import "./App.css";

function Login({ onLogin, switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      setError("Invalid email or password");
    }
  }

  return (
    <div className="auth-card">
      <h2 className="auth-title">Welcome back 🐾</h2>
      <p className="auth-subtitle">Sign in to find new friends for your pup.</p>
      {error && <p className="auth-error">{error}</p>}

      <form onSubmit={handleLogin} className="auth-form">
        <label className="auth-label">
          Email
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="auth-label">
          Password
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <button type="submit" className="btn btn-primary full-width">
          Log in
        </button>
      </form>

      <div className="auth-footer">
        <span>New here?</span>
        <button type="button" className="link-button" onClick={switchToRegister}>
          Create an account
        </button>
      </div>
    </div>
  );
}

function Register({ switchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    zip: ""
  });
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");
    setIsError(false);
    
    // Validate required fields
    if (!form.name || !form.email || !form.password) {
      setMsg("⚠️ Please fill in all required fields (Name, Email, Password)");
      setIsError(true);
      return;
    }
    
    try {
      const response = await api.post("/auth/register", form);
      console.log("Registration successful:", response.data);
      setMsg("🎉 Account created! You can log in now.");
      setIsError(false);
      // Clear form after successful registration
      setForm({
        name: "",
        email: "",
        password: "",
        city: "",
        zip: ""
      });
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg = err.response?.data?.msg || err.response?.data?.message || "Registration failed. Please try again.";
      setMsg(errorMsg);
      setIsError(true);
    }
  }

  return (
    <div className="auth-card">
      <h2 className="auth-title">Join DogMatch 🐶</h2>
      <p className="auth-subtitle">Create your account and add your pup.</p>
      {msg && <p className={isError ? "auth-error" : "auth-info"}>{msg}</p>}

      <form onSubmit={handleRegister} className="auth-form">
        <label className="auth-label">
          Name *
          <input
            className="auth-input"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            required
          />
        </label>

        <label className="auth-label">
          Email *
          <input
            className="auth-input"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="auth-label">
          Password *
          <input
            className="auth-input"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
            minLength="6"
          />
        </label>

        <div className="auth-grid">
          <label className="auth-label">
            City
            <input
              className="auth-input"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="San Diego"
            />
          </label>
          <label className="auth-label">
            ZIP
            <input
              className="auth-input"
              name="zip"
              value={form.zip}
              onChange={handleChange}
              placeholder="92101"
            />
          </label>
        </div>

        <button type="submit" className="btn btn-primary full-width">
          Create account
        </button>
      </form>

      <div className="auth-footer">
        <span>Already have an account?</span>
        <button type="button" className="link-button" onClick={switchToLogin}>
          Log in
        </button>
      </div>
    </div>
  );
}

function AddDog({ token, onDogCreated }) {
  const [dog, setDog] = useState({
    name: "",
    age: "",
    breed: "",
    gender: "",
    energy: "",
    temperament: "",
    vaccinated: false,
    city: "",
    zip: "",
    imageUrl: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setDog(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    
    try {
      const payload = {
        name: dog.name,
        age: Number(dog.age) || undefined,
        breed: dog.breed,
        gender: dog.gender,
        energy: dog.energy,
        temperament: dog.temperament
          ? dog.temperament.split(",").map(t => t.trim())
          : [],
        vaccinated: dog.vaccinated,
        images: dog.imageUrl ? [dog.imageUrl] : [],
        city: dog.city,
        zip: dog.zip
      };

      const res = await api.post("/dogs/create", payload);
      onDogCreated(res.data);
      setDog({
        name: "",
        age: "",
        breed: "",
        gender: "",
        energy: "",
        temperament: "",
        vaccinated: false,
        city: "",
        zip: "",
        imageUrl: ""
      });
    } catch (err) {
      console.error("Error creating dog:", err);
      setError("Failed to create dog profile. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Add a dog</h2>
        <p>Tell us about your pup so we can find the perfect playmates.</p>
      </div>
      {error && (
        <div style={{ 
          background: '#fee', 
          border: '2px solid #d9534f', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '12px',
          color: '#d9534f'
        }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSave} className="panel-form">
        <div className="form-row">
          <label className="auth-label">
            Name
            <input
              type="text"
              className="auth-input"
              name="name"
              value={dog.name}
              onChange={handleChange}
              placeholder="Bella"
              required
            />
          </label>
          <label className="auth-label">
            Age
            <input
              type="number"
              className="auth-input"
              name="age"
              value={dog.age}
              onChange={handleChange}
              placeholder="2"
              min="0"
              max="30"
            />
          </label>
        </div>

        <div className="form-row">
          <label className="auth-label">
            Breed
            <input
              type="text"
              className="auth-input"
              name="breed"
              value={dog.breed}
              onChange={handleChange}
              placeholder="Golden Retriever"
            />
          </label>
        </div>

        <div className="form-row">
          <label className="auth-label">
            Gender
            <select
              className="auth-input"
              name="gender"
              value={dog.gender}
              onChange={handleChange}
            >
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label className="auth-label">
            Energy
            <select
              className="auth-input"
              name="energy"
              value={dog.energy}
              onChange={handleChange}
            >
              <option value="">Energy level</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>

        <label className="auth-label">
          Temperament (comma separated)
          <input
            type="text"
            className="auth-input"
            name="temperament"
            value={dog.temperament}
            onChange={handleChange}
            placeholder="playful, friendly, good with kids"
          />
        </label>

        <div className="form-row">
          <label className="auth-label checkbox-label">
            <input
              type="checkbox"
              name="vaccinated"
              checked={dog.vaccinated}
              onChange={handleChange}
            />
            <span>Vaccinated</span>
          </label>
        </div>

        <div className="form-row">
          <label className="auth-label">
            City
            <input
              type="text"
              className="auth-input"
              name="city"
              value={dog.city}
              onChange={handleChange}
              placeholder="San Diego"
            />
          </label>
          <label className="auth-label">
            ZIP
            <input
              type="text"
              className="auth-input"
              name="zip"
              value={dog.zip}
              onChange={handleChange}
              placeholder="92101"
              maxLength="10"
            />
          </label>
        </div>

        <label className="auth-label">
          Image URL (optional)
          <input
            type="url"
            className="auth-input"
            name="imageUrl"
            value={dog.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/dog.jpg"
          />
        </label>

        <button type="submit" className="btn btn-secondary full-width" disabled={saving}>
          {saving ? "Saving..." : "Save dog"}
        </button>
      </form>
    </div>
  );
}

function Discover({ token, activeDogId }) {
  const [dogs, setDogs] = useState([]);
  const [index, setIndex] = useState(0);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function fetchDogs() {
      const res = await api.get(`/dogs/discover/${activeDogId}`);
      setDogs(res.data);
      setIndex(0);
    }
    if (activeDogId) fetchDogs();
  }, [activeDogId]);

  async function act(action) {
    const current = dogs[index];
    if (!current) return;
    await api.post("/match/action", {
      fromDog: activeDogId,
      toDog: current._id,
      action
    });
    setToast(action === "like" ? "You liked this dog! 🐾" : "Skipped for now.");
    setIndex(i => i + 1);
    setTimeout(() => setToast(""), 1500);
  }

  const current = dogs[index];

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Discover pups nearby</h2>
        <p>Swipe through dogs that could be your pup's next best friend.</p>
      </div>

      {current ? (
        <div className="dog-card">
          {current.images && current.images[0] && (
            <div className="dog-card-image-wrap">
              <img
                src={current.images[0]}
                alt={current.name}
                className="dog-card-image"
              />
            </div>
          )}
          <div className="dog-card-body">
            <div className="dog-card-title-row">
              <h3>{current.name}</h3>
              <span className="dog-chip">{current.breed || "Unknown breed"}</span>
            </div>
            <p className="dog-meta">
              Energy: <strong>{current.energy || "n/a"}</strong>{" "}
              {current.location?.city && `• ${current.location.city}`}
            </p>
            {current.temperament?.length > 0 && (
              <div className="dog-tags">
                {current.temperament.map(tag => (
                  <span className="dog-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="dog-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => act("pass")}
              >
                Pass
              </button>
              <button
                type="button"
                className="btn btn-like"
                onClick={() => act("like")}
              >
                Like ❤️
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="empty-state">No more dogs to show right now. Check back soon!</p>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Matches({ activeDogId }) {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    async function fetchMatches() {
      if (!activeDogId) return;
      const res = await api.get(`/match/list/${activeDogId}`);
      setMatches(res.data);
    }
    fetchMatches();
  }, [activeDogId]);

  return (
    <div className="panel small-panel">
      <div className="panel-header">
        <h2>Matches</h2>
        <p>Your dog's new friends.</p>
      </div>

      {matches.length === 0 && (
        <p className="empty-state">No matches yet. Start liking some pups!</p>
      )}

      <div className="matches-list">
        {matches.map(m => {
          const d1 = m.dog1;
          const d2 = m.dog2;
          if (!d1 || !d2) return null;
          return (
            <div className="match-item" key={m._id}>
              <div className="match-avatars">
                <div className="match-avatar">
                  {d1.images?.[0] ? (
                    <img src={d1.images[0]} alt={d1.name} />
                  ) : (
                    <span>{d1.name?.[0] || "?"}</span>
                  )}
                </div>
                <span className="match-heart">❤️</span>
                <div className="match-avatar">
                  {d2.images?.[0] ? (
                    <img src={d2.images[0]} alt={d2.name} />
                  ) : (
                    <span>{d2.name?.[0] || "?"}</span>
                  )}
                </div>
              </div>
              <div className="match-info">
                <strong>{d1.name}</strong> &amp; <strong>{d2.name}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Community({ activeDogId }) {
  const [allDogs, setAllDogs] = useState([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAllDogs() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/dogs/all");
        setAllDogs(res.data || []);
      } catch (err) {
        console.error("Error fetching community dogs:", err);
        setError("Unable to load community dogs. Please refresh the page.");
        setAllDogs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAllDogs();
  }, []);

  async function handleLike(dogId) {
    if (!activeDogId) {
      setToast("⚠️ Select your dog first!");
      setTimeout(() => setToast(""), 2000);
      return;
    }
    try {
      await api.post("/match/action", {
        fromDog: activeDogId,
        toDog: dogId,
        action: "like"
      });
      setToast("❤️ Liked!");
      setTimeout(() => setToast(""), 1500);
    } catch (err) {
      console.error("Error liking dog:", err);
    }
  }

  function handleShare(dog) {
    const shareText = `Check out ${dog.name}, a ${dog.breed || "adorable"} looking for playmates!`;
    if (navigator.share) {
      navigator.share({
        title: `Meet ${dog.name}`,
        text: shareText,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      setToast("📋 Link copied to clipboard!");
      setTimeout(() => setToast(""), 2000);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Community Stream</h2>
        <p>Browse all dogs in the community</p>
      </div>

      {loading ? (
        <p className="empty-state">Loading community dogs...</p>
      ) : error ? (
        <div className="empty-state">
          <p style={{ color: '#d9534f' }}>{error}</p>
          <button 
            className="btn btn-secondary" 
            onClick={() => window.location.reload()}
            style={{ marginTop: '10px' }}
          >
            Retry
          </button>
        </div>
      ) : allDogs.length === 0 ? (
        <p className="empty-state">No dogs in the community yet. Be the first to add one!</p>
      ) : (
        <div className="community-grid">
          {allDogs.map(dog => (
            <div key={dog._id} className="community-card">
              {dog.images?.[0] && (
                <div className="community-card-image">
                  <img src={dog.images[0]} alt={dog.name} />
                </div>
              )}
              <div className="community-card-content">
                <h3>{dog.name}</h3>
                <p className="dog-breed">{dog.breed || "Unknown breed"}</p>
                <div className="community-meta">
                  <span>⚡ {dog.energy || "n/a"}</span>
                  {dog.location?.city && <span>📍 {dog.location.city}</span>}
                </div>
                {dog.temperament?.length > 0 && (
                  <div className="community-tags">
                    {dog.temperament.slice(0, 3).map(tag => (
                      <span key={tag} className="dog-tag">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="community-actions">
                  <button
                    className="btn btn-like"
                    onClick={() => handleLike(dog._id)}
                    disabled={dog._id === activeDogId}
                  >
                    ❤️ Like
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleShare(dog)}
                  >
                    📤 Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function App() {
  const [view, setView] = useState("dashboard"); // "login" | "register" | "dashboard"
  const [token, setToken] = useState("bypass-token");
  const [user, setUser] = useState({ name: "Demo User", email: "demo@pawsocial.com" });
  const [myDogs, setMyDogs] = useState([]);
  const [activeDogId, setActiveDogId] = useState("");

  useEffect(() => {
    async function fetchDogs() {
      try {
        const res = await api.get("/dogs/mine");
        setMyDogs(res.data || []);
        if (res.data && res.data[0]) {
          setActiveDogId(res.data[0]._id);
        }
      } catch (err) {
        console.error("Error fetching my dogs:", err);
        setMyDogs([]);
      }
    }
    fetchDogs();
  }, []);

  function handleLogin(tokenValue, userValue) {
    setToken(tokenValue);
    setUser(userValue);
    setView("dashboard");
  }

  function handleDogCreated(dog) {
    setMyDogs(prev => [...prev, dog]);
    if (!activeDogId) setActiveDogId(dog._id);
  }

  // Auth layout (login/register)
  if (view === "login" || view === "register") {
    return (
      <div className="app-shell auth-shell">
        <div className="auth-hero">
          <div className="auth-hero-inner">
            <h1>DogMatch</h1>
            <p>
              A social space where dogs find playmates, buddies, and maybe even a soulmate.
              Connect with local dog owners and set up safe, fun meetups.
            </p>
            <ul className="hero-list">
              <li>🐕 Create profiles for your dogs</li>
              <li>📍 Discover pups nearby</li>
              <li>💬 Match & start chatting with owners</li>
            </ul>
          </div>
        </div>

        <div className="auth-main">
          {view === "login" ? (
            <Login
              onLogin={handleLogin}
              switchToRegister={() => setView("register")}
            />
          ) : (
            <Register switchToLogin={() => setView("login")} />
          )}
        </div>
      </div>
    );
  }

  // Dashboard layout
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <span className="logo">DogMatch</span>
          <nav className="topbar-nav">
            <button
              type="button"
              className="topbar-link topbar-link-active"
            >
              Dashboard
            </button>
          </nav>
        </div>
        <div className="topbar-right">
          {user && <span className="topbar-user">Hi, {user.name}</span>}
          <button
            type="button"
            className="btn btn-outline small"
            onClick={() => {
              setToken("");
              setUser(null);
              setView("login");
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="dashboard-left">
          <AddDog token={token} onDogCreated={handleDogCreated} />

          <div className="panel small-panel">
            <div className="panel-header">
              <h2>My dogs</h2>
              <p>Select a dog to use for matching.</p>
            </div>
            {myDogs.length === 0 && (
              <p className="empty-state">
                You haven't added any dogs yet. Add your first pup above.
              </p>
            )}
            <div className="dog-list">
              {myDogs.map(d => (
                <label key={d._id} className="dog-radio">
                  <input
                    type="radio"
                    value={d._id}
                    checked={activeDogId === d._id}
                    onChange={() => setActiveDogId(d._id)}
                  />
                  <div className="dog-radio-body">
                    <span className="dog-radio-name">{d.name}</span>
                    <span className="dog-radio-sub">
                      {d.breed || "Unknown breed"}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-right">
          <Community activeDogId={activeDogId} />
          {activeDogId ? (
            <>
              <Discover token={token} activeDogId={activeDogId} />
              <Matches activeDogId={activeDogId} />
            </>
          ) : (
            <div className="panel">
              <div className="panel-header">
                <h2>No active dog selected</h2>
                <p>Add a dog and select it from the list to start discovering matches.</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
