var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  setTimeout(function () {
    createPostArea.style.transform = 'translateY(0)';
  }, 1);

  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //     .then(function (registrations) {
  //       for (let i = 0; i < registrations.length; i++) {
  //         registrations[i].unregister();
  //       }
  //     })
  // }



}

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// function onSaveButtonClicled(addEventListener) {
//   console.log('Clicked');
//   if ('caches' in window) {
//     caches.open('user-requested')
//       .then(function (cache) {
//           cache.add('https://httpbin.org/get');
//           cache.add('/src/images/sf-boat.jpg');
//       });

//   }
// }

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}



function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicled);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);

}

function updateUi(data) {

  clearCards();
  for (let i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

// Cache, then network
var url = 'https://pwagram-7edc8.firebaseio.com/posts.json';
var networkDataReceived = false;

fetch(url)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    networkDataReceived = true;
    console.log('From web: ', data);
    var dataArray = []
    for (var key in data) {
      dataArray.push(data[key]);
    }

    updateUi(dataArray)
  });


// if ('caches' in window) {
//   caches.match(url)
//     .then(function (response) {
//       if (response) {
//         return response.json();
//       }
//     })
//     .then(function (data) {
//       console.log('From cache: ', data)
//       if (!networkDataReceived) {
//         var dataArray = []
//         for (var key in data) {
//           dataArray.push(data[key]);
//         }
//         updateUi(dataArray)
//       }
//     })
// }
if ('indexedDB' in window) {
  readAllData('posts')
    .then(function (data) {
      if (!networkDataReceived) {
        console.log('from cache:', data);
        updateUi(data);
      }
    })
}

function sendData() {
  fetch('https://pwagram-7edc8.firebaseio.com/posts.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-7edc8.appspot.com/o/sf-boat.jpg?alt=media&token=a001905a-4c52-4903-a485-522c2b7012f4'
      })
    })
    .then(function (res) {
      console.log('Sent data', res);
      updateUi();
    })
    .catch(function (err) {
      console.log(err);
    });
};

form.addEventListener('submit', function (evt) {
  evt.preventDefault();
  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid data!');
    return;
  }
  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(function (sw) {
        var post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value
        };
        writeData('sync-posts', post)
          .then(function () {
            return sw.sync.register('sync-new-posts');
          })
          .then(function () {
            var snackbarContainer = document.querySelector('#confirmation-toast');
            var data = {
              message: 'Your Post was saved for syncing'
            }
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch(function (err) {
            console.log(err);
          });
      });
  } else {
    sendData();
  }
});