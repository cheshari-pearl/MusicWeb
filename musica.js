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
    // Filter the search results to display only the artist you have searched for
    const filteredArtists = data.artists.items.filter(artist => artist.name.toLowerCase() === query.toLowerCase());
    return filteredArtists.map(artist => ({
      name: artist.name,
      id: artist.id,
      images: artist.images, // Include images array
      external_urls: artist.external_urls
    }));
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

  return {
    _getToken: _getToken,
    _getRefreshToken:_getRefreshToken,
    _searchArtists: _searchArtists,
    _getArtistTopTracks: _getArtistTopTracks
  }
})();

const UIController = (function() {
  const DOMElements = {
    searchInput: '#searchInput',
    searchButton: '#searchButton',
    resultsList: '#resultsList',
  }

  const displayArtistResults = async (artists) => {
    const resultsList = document.querySelector(DOMElements.resultsList);
    resultsList.innerHTML = '';

    artists.forEach(async (artist) => {
      const listItem = document.createElement('div');
      listItem.setAttribute("class", "listItems");

      const title = document.createElement('h3');
      title.innerHTML = artist.name;
      
      const artistImage = document.createElement('img');
      if (artist.images.length > 0) {
        artistImage.src = artist.images[0].url;
        artistImage.alt = artist.name;
        artistImage.style.width = '100px'; // Set image width
        artistImage.style.height = '100px'; // Set image height
        listItem.appendChild(artistImage);
      }
      
      const link = document.createElement('a');
      link.href = artist.external_urls.spotify;
      link.textContent = 'Listen Here';

      listItem.appendChild(link);
      listItem.appendChild(title);
      resultsList.appendChild(listItem);

      // Get top tracks of the artist and display
      const token = await APIController._getToken();
      const tracks = await APIController._getArtistTopTracks(token, artist.id);
      displayTracks(tracks);
    });
  }

  const displayTracks = (tracks) => {
    const resultsList = document.querySelector(DOMElements.resultsList);
    tracks.forEach(track => {
      const trackItem = document.createElement('div');
      trackItem.innerHTML = `<strong>${track.name}</strong> - ${track.album.name}`;
      resultsList.appendChild(trackItem);
    });
  }

  return {
    DOMElements: DOMElements,
    displayArtistResults: displayArtistResults,
  }
})();

const APPController = (function(APICtrl, UICtrl) {
  const DOMElements = UICtrl.DOMElements;
  const searchButton = document.querySelector(DOMElements.searchButton);

  searchButton.addEventListener('click', async () => {
    const searchInput = document.querySelector(DOMElements.searchInput);
    const searchQuery = searchInput.value;
    const token = await APICtrl._getToken();
    const artists = await APICtrl._searchArtists(token, searchQuery);
    UICtrl.displayArtistResults(artists);
  });

  return {
    init: function() {
      console.log('App is starting');
    }
  }
})(APIController, UIController);

APPController.init();
