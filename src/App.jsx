import React, { useState, useEffect } from 'react';

// Custom Select Component
const Select = ({ value, onChange, options, placeholder }) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="select-custom"
    >
      <option value="">{placeholder}</option>
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
};

// Login Component
const Login = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://frontend-take-home-service.fetch.com/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
        credentials: 'include',
      });

      if (response.ok) {
        onLogin();
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred during login.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Dog Adoption Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="button primary">Login</button>
        </form>
      </div>
    </div>
  );
};

// Dog Card Component
const DogCard = ({ dog, isFavorite, onFavoriteToggle }) => {
  return (
    <div className="dog-card">
      <div className="dog-card-header">
        <h3>{dog.name}</h3>
        <button 
          onClick={() => onFavoriteToggle(dog.id)}
          className={`favorite-button ${isFavorite ? 'favorite-active' : ''}`}
        >
          ♥
        </button>
      </div>
      <img src={dog.img} alt={dog.name} className="dog-image" />
      <div className="dog-details">
        <p>Breed: {dog.breed}</p>
        <p>Age: {dog.age} years</p>
        <p>Location: {dog.zip_code}</p>
      </div>
    </div>
  );
};

// Match Display Component
const MatchDisplay = ({ dog }) => {
  return (
    <div className="match-card">
      <h2>You've been matched with {dog.name}! 🎉</h2>
      <div className="match-content">
        <img src={dog.img} alt={dog.name} className="match-image" />
        <div className="match-details">
          <p>Breed: {dog.breed}</p>
          <p>Age: {dog.age} years</p>
          <p>Location: {dog.zip_code}</p>
        </div>
      </div>
    </div>
  );
};

// Search Component
const DogSearch = ({ onLogout }) => {
  const [breeds, setBreeds] = useState([]);
  const [selectedBreed, setSelectedBreed] = useState('');
  const [dogs, setDogs] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [sortField, setSortField] = useState('breed');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [nextCursor, setNextCursor] = useState(null);
  const [prevCursor, setPrevCursor] = useState(null);
  const [matchedDog, setMatchedDog] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBreeds();
    fetchDogs();
  }, []);

  const fetchBreeds = async () => {
    try {
      const response = await fetch('https://frontend-take-home-service.fetch.com/dogs/breeds', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setBreeds(data);
      }
    } catch (error) {
      setError('Error fetching breeds');
    }
  };

  const fetchDogs = async (paginationUrl = null) => {
    setIsLoading(true);
    setError('');
    try {
      // Build the URL: either use the provided pagination URL or construct a new one
      let url;
      if (paginationUrl) {
        // The API returns relative URLs, so we need to prepend the base URL
        url = `https://frontend-take-home-service.fetch.com${paginationUrl}`;
      } else {
        // Construct a new search URL with all filters
        url = `https://frontend-take-home-service.fetch.com/dogs/search?size=12`;
        if (selectedBreed) {
          url += `&breeds=${encodeURIComponent(selectedBreed)}`;
        }
        url += `&sort=${sortField}:${sortOrder}`;
      }

      const searchResponse = await fetch(url, {
        credentials: 'include',
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const dogIds = searchData.resultIds;
        
        // Save pagination information
        setTotalResults(searchData.total);
        setNextCursor(searchData.next || null);
        setPrevCursor(searchData.prev || null);
        
        // Calculate current page based on total and results per page
        if (!paginationUrl) {
          setCurrentPage(1);
        }

        // Fetch the actual dog data
        if (dogIds.length > 0) {
          const dogsResponse = await fetch('https://frontend-take-home-service.fetch.com/dogs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dogIds),
            credentials: 'include',
          });

          if (dogsResponse.ok) {
            const dogsData = await dogsResponse.json();
            setDogs(dogsData);
          } else {
            setError('Failed to fetch dog details');
          }
        } else {
          setDogs([]);
          setError('No dogs found matching your criteria');
        }
      } else {
        setError('Search request failed');
      }
    } catch (error) {
      setError('Error fetching dogs: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('https://frontend-take-home-service.fetch.com/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      onLogout();
    } catch (error) {
      setError('Error logging out');
    }
  };

  const toggleFavorite = (dogId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(dogId)) {
        newFavorites.delete(dogId);
      } else {
        newFavorites.add(dogId);
      }
      return newFavorites;
    });
  };

  const generateMatch = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('https://frontend-take-home-service.fetch.com/dogs/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...favorites]),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const matchedDogId = data.match;
        
        const dogResponse = await fetch('https://frontend-take-home-service.fetch.com/dogs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([matchedDogId]),
          credentials: 'include',
        });

        if (dogResponse.ok) {
          const [dogData] = await dogResponse.json();
          setMatchedDog(dogData);
        }
      }
    } catch (error) {
      setError('Error generating match');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="search-container">
      <div className="header">
        <h1>Dog Adoption Search</h1>
        <button onClick={handleLogout} className="button secondary">
          Logout
        </button>
      </div>

      <div className="search-panel">
        <div className="controls">
          <div className="filter-group">
            <label htmlFor="breed-select">Filter by breed:</label>
            <Select
              id="breed-select"
              value={selectedBreed}
              onChange={setSelectedBreed}
              options={breeds}
              placeholder="All breeds"
            />
          </div>

          <div className="sort-group">
            <label>Sort:</label>
            <div className="sort-controls">
              <Select
                value={sortField}
                onChange={setSortField}
                options={['name', 'age']}
                placeholder="Sort"
              />
              
              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="button secondary sort-direction"
                aria-label={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          <button onClick={() => fetchDogs()} className="button primary">
            Search Dogs
          </button>
        </div>

        <div className="favorites-bar">
          {favorites.size > 0 ? (
            <button onClick={generateMatch} className="button accent">
              <span className="heart-icon">♥</span> Generate Match with {favorites.size} Favorites
            </button>
          ) : (
            <div className="favorites-hint">
              Select your favorite dogs by clicking the heart icon
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading">Loading...</div>}

      {matchedDog && <MatchDisplay dog={matchedDog} />}

      <div className="dogs-grid">
        {dogs.map((dog) => (
          <DogCard
            key={dog.id}
            dog={dog}
            isFavorite={favorites.has(dog.id)}
            onFavoriteToggle={toggleFavorite}
          />
        ))}
      </div>

      <div className="pagination">
        <button
          onClick={() => {
            if (prevCursor) {
              setCurrentPage(prev => prev - 1);
              fetchDogs(prevCursor);
            }
          }}
          disabled={!prevCursor}
          className="button secondary"
        >
          Previous
        </button>
        
        <div className="pagination-info">
          <span>Page {currentPage}</span>
          <span className="total-results">Total: {totalResults} dogs</span>
        </div>
        
        <button
          onClick={() => {
            if (nextCursor) {
              setCurrentPage(prev => prev + 1);
              fetchDogs(nextCursor);
            }
          }}
          disabled={!nextCursor}
          className="button secondary"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="app">
      <style>
        {`
          /* Reset and base styles */
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          .app {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            min-height: 100vh;
            background-color: #f5f5f5;
          }

          /* Login styles */
          .login-container {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .login-card {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
          }

          /* Form elements */
          .input-field {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
          }

          .select-custom {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            background: white;
            min-width: 200px;
          }

          /* Buttons */
          .button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.2s;
          }

          .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .primary {
            background-color: #007bff;
            color: white;
          }

          .secondary {
            background-color: #6c757d;
            color: white;
          }

          .accent {
            background-color: #28a745;
            color: white;
          }

          /* Search page styles */
          .search-container {
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }
          
          .search-panel {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }

          .controls {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            flex-wrap: wrap;
            align-items: flex-end;
          }
          
          .filter-group, .sort-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .favorites-bar {
            display: flex;
            justify-content: center;
            padding-top: 15px;
            border-top: 1px solid #eee;
          }
          
          .favorites-hint {
            color: #666;
            font-style: italic;
          }
          
          .heart-icon {
            color: #ff4444;
          }

          /* Dog cards */
          .dogs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }

          .dog-card {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .dog-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
          }

          .dog-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
          }

          .dog-details {
            padding: 15px;
          }

          /* Match card */
          .match-card {
            background: #e8f5e9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }

          .match-content {
            display: flex;
            gap: 20px;
            margin-top: 15px;
          }

          .match-image {
            width: 200px;
            height: 200px;
            object-fit: cover;
            border-radius: 4px;
          }

          /* Utility classes */
          .error-message {
            color: #dc3545;
            padding: 10px;
            margin: 10px 0;
            background: #f8d7da;
            border-radius: 4px;
          }

          .loading {
            text-align: center;
            padding: 20px;
            font-style: italic;
          }

          .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin-top: 20px;
            padding: 20px 0;
          }
          
          .pagination-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 150px;
          }
          
          .total-results {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
          }

          .favorite-button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
            transition: color 0.2s;
          }

          .favorite-button:hover {
            color: #ff4444;
          }

          .favorite-active {
            color: #ff4444;
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .controls {
              flex-direction: column;
              align-items: center;
            }
            
            .match-content {
              flex-direction: column;
            }

            .match-image {
              width: 100%;
              height: 300px;
            }

            .dogs-grid {
              grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            }
          }
        `}
      </style>
      {isLoggedIn ? (
        <DogSearch onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <Login onLogin={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
};

export default App;