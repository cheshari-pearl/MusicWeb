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
  
       
        
  
        listItem.appendChild(link);
        listItem.appendChild(artist_image);
        listItem.appendChild(title);
        resultsList.appendChild(listItem);
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
      const refreshToken = await APICtrl._getRefreshToken();
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