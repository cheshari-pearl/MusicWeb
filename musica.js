const APIController = (function() {
    const clientId = "e2c54682a9e9419aa31a7a8ce1ae29b5";
    const clientSecret = "92d05d9111ee4c9f8e08546103b38dc1";
  
    const _getToken = async () => {
      const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type' : 'application/x-www-form-urlencoded',
          'Authorization' : 'Basic ' + btoa( clientId + ':' + clientSecret)
        },
        body: 'grant_type=client_credentials'
      });
      const data = await result.json();
      return data.access_token;
    }

    const _getRefreshToken = async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      const url = "https://accounts.spotify.com/api/token";
       const payload = {
         method: 'POST',
         headers: {
           'Content-Type': 'application/x-www-form-urlencoded'
         },
         body: new URLSearchParams({
           grant_type: 'refresh_token',
           refresh_token: refreshToken,
           client_id: clientId
         })
       }
       const result = await fetch(url, payload);
       const data = await result.json();
       return data.refresh_token
     }
  
    const _searchArtists = async (token, query) => {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=artist`, {
        headers: {
          'Authorization' : 'Bearer ' + token
        }
      });
      const data = await response.json();
      return data.artists.items;
    }
  
    const _getArtistTopTracks = async (token, artistId) => {
      const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?country=Kenya`, {
        headers: {
          'Authorization' : 'Bearer ' + token
        }
      });
      const data = await response.json();
      return data.tracks;
    }
  
    const _createPlaylist = async (token, userId, playlistName) => {
      const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization' : 'Bearer ' + token,
          'Content-Type' : 'application/json'
        },
        body: JSON.stringify({ name: playlistName })
      });
      const data = await response.json();
      return data.id;
    }
  
    const _addToPlaylist = async (token, playlistId, trackUris) => {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization' : 'Bearer ' + token,
          'Content-Type' : 'application/json'
        },
        body: JSON.stringify({ uris: trackUris })
      });
      return response.ok;
    }
  
    return {
      _getToken: _getToken,
      _getRefreshToken:_getRefreshToken,
      _searchArtists: _searchArtists,
      _getArtistTopTracks: _getArtistTopTracks,
      _createPlaylist: _createPlaylist,
      _addToPlaylist: _addToPlaylist
    }
  })();
  
  const UIController = (function() {
    const DOMElements = {
      searchInput: '#searchInput',
      searchButton: '#searchButton',
      resultsList: '#resultsList',
      createPlaylistButton: '#createPlaylistButton',
      playlistNameInput: '#playlistNameInput',
      playlistSongs: '#playlistSongs',
      playButton: '#playButton'
    }
  
    const displayArtistResults = async (artists) => {
      const resultsList = document.querySelector(DOMElements.resultsList);
      resultsList.innerHTML = '';
  
      artists.forEach(async (artist) => {
        const listItem = document.createElement('div');
        listItem.setAttribute("class", "listItems");
        const artist_image = document.createElement('img');
        const img_url = ["images"];
        for(const url of img_url[0]){
            artist_image.src = url.url;
        }
        const title = document.createElement('h3');
        title.innerHTML = artist.name;        
        const link = document.createElement('a');
        link.href = artist.external_urls.spotify;
        link.textContent = 'Listen Here';
  
        const addButton = document.createElement('button');
        addButton.textContent = 'Add to Playlist';
        addButton.addEventListener('click', async () => {
          const token = await APIController._getToken();
          const refresh_token = await APIController._getRefreshToken();
          const userId = 'YOUR_USER_ID'; // Replace with Spotify user ID
          const tracks = await APIController._getArtistTopTracks(token, artist.id);
          const trackUris = tracks.map(track => track.uri);
          const playlistId = await APIController._createPlaylist(token, userId, 'YOUR_PLAYLIST_NAME'); // Replace with playlist name
          const success = await APIController._addToPlaylist(token, playlistId, trackUris);
          if (success) {
            alert(`${artist.name}'s top tracks added to your playlist`);
          } else {
            alert('Failed to add tracks to playlist.');
          }
        });
  
        listItem.appendChild(link);
        listItem.appendChild(artist_image);
        listItem.appendChild(title);
        listItem.appendChild(addButton);
        resultsList.appendChild(listItem);
      });
    }
  
    const displayPlaylistSongs = (songs) => {
      const playlistSongs = document.querySelector(DOMElements.playlistSongs);
      playlistSongs.innerHTML = '';
  
      songs.forEach((song) => {
        const listItem = document.createElement('li');
        listItem.textContent = song.name;
        playlistSongs.appendChild(listItem);
      });
    }
  
    const playPlaylist = async () => {
      const token = await APIController._getToken();
      const userId = 'USER_ID'; 
      const playlistId = 'PLAYLIST_ID'; 
      const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
        headers: {
          'Authorization' : 'Bearer ' + token
        }
      });
      const data = await response.json();
      const songs = data.items.map(item => item.track);
      displayPlaylistSongs(songs);
    }
  
    return {
      DOMElements: DOMElements,
      displayArtistResults: displayArtistResults,
      playPlaylist: playPlaylist
    }
  })();
  
  const APPController = (function(APICtrl, UICtrl) {
    const DOMElements = UICtrl.DOMElements;
  
    const searchButton = document.querySelector(DOMElements.searchButton);
    const createPlaylistButton = document.querySelector(DOMElements.createPlaylistButton);
    const playButton = document.querySelector(DOMElements.playButton);
  
    searchButton.addEventListener('click', async () => {
      const searchInput = document.querySelector(DOMElements.searchInput);
      const searchQuery = searchInput.value;
      const token = await APICtrl._getToken();
      const refreshToken = await APICtrl._getRefreshToken();
      const artists = await APICtrl._searchArtists(token, searchQuery);
      UICtrl.displayArtistResults(artists);
    });
  
    createPlaylistButton.addEventListener('click', async () => {
      const playlistNameInput = document.querySelector(DOMElements.playlistNameInput);
      const playlistName = playlistNameInput.value;
      const token = await APICtrl._getToken();
      const refreshToken = await APICtrl._getRefreshToken();
      const userId = 'USER_ID'; 
      const playlistId = await APICtrl._createPlaylist(token, userId, playlistName);
      alert(`Playlist created with ID: ${playlistId}`);
    });
  
    playButton.addEventListener('click', async () => {
      await UICtrl.playPlaylist();
    });
  
    return {
      init: function() {
        console.log('App is starting');
      }
    }
  })(APIController, UIController);
  
  APPController.init();