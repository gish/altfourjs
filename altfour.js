(function()
{
    var root = this;
    
    var namespace = 'altfourjs';


	/**
	 * Class for handling local storage
	 */
	var LocalStorage = function()
	{
		this.supported = null;
	};

	LocalStorage.prototype = {
		/**
		 * Verifies local storage is supported
		 */
		isSupported : function()
		{
			if (this.hasLocalStorage === null)
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
		add : function(key, value)
		{
			if (this.isSupported())
			{
				localStorage.setItem(key, JSON.stringify(value));
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
                return JSON.parse(localStorage.getItem(namespace));
            }
            else
            {
                return null;
            }
		}
	};
    
    var Cache = function()
    {
        var self = this;
        
        /**
         * Runs GC process
         */
        this.cleanup = function(key)
        {
            delete this.storage[key];
			this.saveToLocalStorage();
        };

        /**
         * Registers key for removal
         */
        this.registerGc = function(key, expiry)
        {
            var self = this;
            
            // Clear potential old GC timer
            this.deregisterGc(key);
            
            // Create timer for GC
            this.garbageCollectors[key] = setTimeout(function()
            {
                self.cleanup.apply(self, [key]);
            }, expiry);
            return this.garbageCollectors[key];
        };

        /**
         * Deregister GC
         */
        this.deregisterGc = function(key)
        {
            clearTimeout(this.garbageCollectors[key]);
            delete this.garbageCollectors[key];
        };

        /**
         * Saves the cache to local storage
         */
        this.saveToLocalStorage = function()
        {
            this.localStorage.add(namespace, this.storage);
        };

        /**
         * Retrieves the cache from local storage
         */
        this.retrieveFromLocalStorage = function()
        {
            return this.localStorage.get(namespace);
        };

		// Local storage handler
		this.localStorage = new LocalStorage();
        
        // Instantiate list with garbage collectors
        this.garbageCollectors = {};
        
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
    };

    Cache.prototype = {
        /**
         * Adds item with key and expiry time
         */
        add : function(key, item, expiry)
        {
            if (expiry)
            {
                // Register key for expiry
                this.registerGc(key, expiry);
                
                expiry = new Date().getTime() + expiry;
            }
            else
            {
                expiry = 0;
                
                // Removes potential GC
                this.deregisterGc(key);
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
                    this.add(key, value, 0);
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
				if (this.garbageCollectors[key] !== undefined)
				{
					clearTimeout(this.garbageCollectors[key]);
					delete this.garbageCollectors[key];
				}
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
            return this;
        }
    };
    
    root.Cache = (root.Cache || Cache);
})();