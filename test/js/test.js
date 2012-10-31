var cache = new Cache();
test("Stored object doesn't expire", function()
{
    var object = new Object();
    cache.add(object, "foo", 1);
    equal(cache.get('foo'), object, "Object didn't expire");
    cache.clear();
});

test("Can store string", function()
{
    var string = "foo bar";
    cache.add(string, 'string', 0);
    equal(cache.get('string'), string, "String in cache");
    cache.clear();
});

test("Can store int", function()
{
    var integer = 1;
    cache.add(integer, 'integer', 0);
    equal(cache.get('integer'), integer, "Integer in cache");
    cache.clear();
});

test("Can store array", function()
{
    var array = [];
    cache.add(array, 'array', 0);
    equal(cache.get('array'), array, "Array in cache");
    cache.clear();
});

test("Object expires", function()
{
    var object = new Object();
    cache.add(object, 'object', -1);
    equal(cache.get('object'), null, "Object has expired");
    cache.clear();
});

test("Object with future date doesn't expire", function()
{
    var object = new Object();
    cache.add(object, 'object', new Date().getTime()+3600);
    equal(cache.get('object'), object, "Object is there");
    cache.clear();
});

test("Cache can be cleared", function()
{
    var foo = 1;
    var bar = 2;
    cache.add(foo, 'foo', 0).add(bar, 'bar', 0);
    cache.clear();
    equal(cache.get('foo'), null, "Foo object is removed");
    equal(cache.get('bar'), null, "Bar object is removed");
});

test("Has JSON", function()
{
    ok(JSON, "No JSON library");
    ok(JSON.stringify, "JSON library has stringify()");
    ok(JSON.parse, "JSON library has parse()");
});


// Local storage
if (cache.hasLocalStorage())
{
    test("Cache in local storage", function()
    {
        cache.add("foo", "foo", 1);
        cache.add(1, "bar", 1);
        cache.saveToLocalStorage();
        equal(localStorage.getItem('altfourjs'), JSON.stringify(cache.storage), "Cache stored in local storage");
    });
}