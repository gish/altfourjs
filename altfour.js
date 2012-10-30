;!function()
{
    var root = this;
    
    var namespace = 'altfourjs';

    var Cache = function()
    {
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
        add : function(item, key, expiry)
        {
            if (expiry)
            {
                expiry = new Date().getTime() + (expiry * 1E3);
            }
            
            this.storage[key] = {
                item   : item,
                expiry : expiry
            };

            // Save to local storage
            this.saveToLocalStorage();
            
            return this;
        },
        /**
         * Retrieves an object
         */
        get : function(key)
        {
            var item;
            var now;
            now = new Date().getTime();
            // Does the key exist?
            if (this.storage[key])
            {
                item = this.storage[key];
                // Is the item valid?
                if (!item.expiry || (item.expiry && item.expiry >= now))
                {
                    return item.item;
                }
                // Remove the item
                else if(item.expiry && item.expiry < now)
                {
                    this.storage[key] = null;
                    
                    // Save to local storage
                    this.saveToLocalStorage();
                }
            }

            // In any other case, return null
            return null;
        },
        /**
         * Empties the cache
         */
        clear : function()
        {
            this.storage = {};
            this.saveToLocalStorage();
            return this;
        },
        /**
         * Verifies support for local storage
         */
        hasLocalStorage : function()
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
                return result && storage;
            }
            catch(e)
            {
                return false;
            }
        },
        /**
         * Saves the cache to local storage
         */
        saveToLocalStorage : function()
        {
            if (this.hasLocalStorage())
            {
                localStorage.setItem(namespace, JSON.stringify(this.storage));
            }
        },
        /**
         * Retrieves the cache from local storage
         */
        retrieveFromLocalStorage : function()
        {
            if (this.hasLocalStorage())
            {
                this.storage = JSON.parse(localStorage.getItem(namespace));
            }
            else
            {
                this.storage = null;
            }
        }
    };
    
    root.Cache = Cache;

}();