var dbPromise = idb.open('post-store', 1, function (db) {
    debugger;
    if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', {
            keyPath: 'id'
        });
    }
    if (!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', {
            keyPath: 'id'
        });
    }
});

function writeData(st, data) {
    return dbPromise
        .then(function (db) {
            var tx = db.transaction(st, 'readwrite');
            var store = tx.objectStore(st);
            store.put(data);
            return tx.complete;
        });
}

function readAllData(st) {
    debugger;
    return dbPromise
        .then(function (db) {
            var tx = db.transaction(st, 'readonly');
            var store = tx.objectStore(st);
            return store.getAll();
        })
}

function clearAllData(st) {
    debugger;
    return dbPromise
        .then(function (db) {
            var tx = db.transaction(st, 'readwrite');
            var store = tx.objectStore(st);
            store.clear();
            return tx.complete;
        });
}

function deleteItemFromData(st, id) {
    dbPromise
        .then(function (db) {
            var tx = db.transaction(st, 'readwrite');
            var store = tx.objectStore(st);
            store.delete(id);
            return tx.complete;
        })
        .then(function () {
            console.log('Item deleted');
        });
}