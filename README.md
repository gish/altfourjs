# altfourjs
A simple caching library for objects.

If supported, it utilizes the local storage API.

# Usage
    var cache = new Cache();

    cache.add(1, "one", 0); // Add object that doesn't expires
    cache.add(2, "two", 1); // Add object that expires in one second

    cache.get("two"); // Retrieve object with key "two"

    cache.clear(); // Clear the cache