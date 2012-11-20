(function()
{
    var root = this;

    var namespace = 'altfourjs';


    /**
    * Class for handling local storage
    */
    var LocalStorage = function(namespace)
    {
        this.supported = null;
        this.namespace = namespace;
    };

    LocalStorage.prototype = {
        /**
        * Verifies local storage is supported
        */
        isSupported : function()
        {
            if (this.supported === null)
            {
                var uid;
                var storage;
                var result;
                uid = new Date();
                try
                {
                    (storage = window.localStorage).setItem(uid, uid);
                    result = storage.getItem(uid) == uid;
                    storage.removeItem(uid);
                    this.supported = (result && storage);
                }
                catch(e)
                {
                    this.supported = false;
                }
            }

            return this.supported;
        },
        /**
        * Store an object in local storage
        */
        add : function(value)
        {
            if (this.isSupported())
            {
                localStorage.setItem(this.namespace, JSON.stringify(value));
            }
        },
        /**
        * Retrieves an object
        */
        get : function()
        {
            // Fetch object if local storage is supported
            if (this.isSupported())
            {
                return JSON.parse(localStorage.getItem(this.namespace));
            }
            else
            {
                return null;
            }
        }
    };

    var GarbageCollector = function(callback)
    {
        // List of timers
        this.collectors = [];
        // Callback function to invoke on expiration
        this.removeCallback = callback;
    };

    GarbageCollector.prototype = {
    /**
    * Adds key for expiration
    */
    add : function(key, expiry)
    {
        var self = this;
        expiry = (expiry - new Date().getTime());

        // Clear potentially old timer
        this.remove(key);

        // In case already expired, remove immediately
        if (expiry <= 0)
        {
            this.expire(key);
        }
        // Otherwise, start timer
        else
        {
            // Create timer
            this.collectors[key] = setTimeout(function()
            {
                self.expire.apply(self, [key]);
                }, expiry);
            }
        },
        /**
        * Removes key
        */
        remove : function(key)
        {
            clearTimeout(this.collectors[key]);
            delete this.collectors[key];
        },
        /**
        * Expire method invoke on expiration
        */
        expire : function(key)
        {
            this.removeCallback(key);
        },
        /**
         * Removes all timers
         */
        clear : function()
        {
            for (var key in this.collectors)
            {
                this.remove(key);
            }
        }
    };

    var Cache = function(name)
    {
        var self = this;

        // Check name set
        if (!name)
        {
            this.namespace = namespace;
        }
        else
        {
            this.namespace = namespace + "-" + name;
        }

        // Local storage handler
        this.localStorage = new LocalStorage(this.namespace);

        // Instantiate garbage collector
        this.garbageCollector = new GarbageCollector(function(key)
        {
            delete self.storage[key];
            self.saveToLocalStorage();
        });

        // Create stats object
        this.stats = {
            misses : 0,
            hits   : 0,
            total  : 0
        };

        // Is local storage supported? Retrieve the object
        this.retrieveFromLocalStorage();

        if (!this.storage)
        {
            this.storage = {};
        }
        else
        {
            this.initGcs();
        }
    };

    Cache.prototype = {
        /**
        * Adds item with key and expiry time
        */
        set: function(key, item, expiry)
        {
            if (expiry)
            {
                expiry = (new Date().getTime() + expiry);
                // Register key for expiry
                this.garbageCollector.add(key, expiry);
            }
            else
            {
                expiry = 0;

                // Removes potential GC
                this.garbageCollector.remove(key);
            }

            this.storage[key] = {
                item   : item,
                expiry : expiry
            };

            // Save to local storage
            this.saveToLocalStorage();

            // Returns self for chaining
            return this;
        },
        /**
        * Retrieves an object
        */
        get : function(key, callback)
        {
            var item;
            var now;
            now = new Date().getTime();
            this.stats.total++;
            // Does the key exist?
            if (this.storage[key])
            {
                item = this.storage[key];
                // Is the item valid?
                if (!item.expiry || (item.expiry && item.expiry >= now))
                {
                    this.stats.hits++;
                    return item.item;
                }
                // Remove the item
                else if (item.expiry && item.expiry < now)
                {
                    this.storage[key] = null;

                    // Save to local storage
                    this.saveToLocalStorage();
                }
            }
            // If not found, but callback defined, the value will be retrieved
            else if (callback)
            {
                var value;
                value = callback(key, this);

                // Function might return void (i.e. asynchronous calls)
                if (value !== undefined)
                {
                    // Add the key with no expiry date
                    this.set(key, value, 0);
                    this.stats.hits++;
                    return this.get(key);
                }
            }

            // In any other case, return undefined
            this.stats.misses++;
            return undefined;
        },
        /**
        * Removes a key
        */
        remove : function(key)
        {
            // Check if key exists
            if (this.storage[key] !== undefined)
            {
                // Remove the key
                delete this.storage[key];

                // Remove garbage collector
                this.garbageCollector.remove(key);
            }
            this.saveToLocalStorage();

            // Returns this for chaining
            return this;
        },
        /**
        * Empties the cache
        */
        clear : function()
        {
            this.storage = {};
            this.saveToLocalStorage();
            this.garbageCollector.clear();
            return this;
        },
        /**
        * Saves the cache to local storage
        */
        saveToLocalStorage : function()
        {
            this.localStorage.add(this.storage);
        },
        /**
        * Retrieves the cache from local storage
        */
        retrieveFromLocalStorage : function()
        {
            this.storage = this.localStorage.get();
        },
        /**
        * Initialize garbage collectors for items loaded from local storage
        */
        initGcs : function()
        {
            for (var key in this.storage)
            {
                var item = this.storage[key];
                // Only register when there's an expiration defined
                if (item.expiry)
                {
                    this.garbageCollector.add(key, item.expiry);
                }
            }
        }
    };

    root.Cache = (root.Cache || Cache);
}).call(this);  