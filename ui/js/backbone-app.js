/* App JS */
// Libraries concatenated & compressed by by jekyll-assets pipeline
//= require backbone.js
//= require backbone.layoutmanager.js

window.App = {};

// Use the backbone.layoutmanager 
// turn it on for all views by default
Backbone.Layout.configure({
    manage: true,
    // Set the prefix to where your templates live on the server
    prefix: "/ui/templates/",

    // This method will check for prebuilt templates first and fall back to
    // loading in via AJAX.
    fetchTemplate: function(path) {
        // Check for a global JST object.  When you build your templates for
        // production, ensure they are all attached here.
        var JST = window.JST || {};

        // If the path exists in the object, use it instead of fetching remotely.
        if (JST[path]) {
            console.log('cached');
            return JST[path];
        }

        // If it does not exist in the JST object, mark this function as
        // asynchronous.
        var done = this.async();

        // Fetch via jQuery's GET.  The third argument specifies the dataType.
        $.get(path + '.html', function(contents) {
            // Assuming you're using underscore templates, the compile step here is
            // `_.template`.
            done(_.template(contents));
        }, "text");
    }
});

// ===================================================================
// Models
// ===================================================================
App.Module = Backbone.Model.extend({
    initialize: function() {
        //console.log('Initialized a Module model');
    }
});

// ===================================================================
// Collections
// ===================================================================
App.PostsCollection = Backbone.Collection.extend({
    model: App.Module,
    url: "/posts.json",
    comparator: 'title'
});
App.StoriesCollection = Backbone.Collection.extend({
    model: App.Module,
    url: "/stories.json",
    comparator: 'title'
});
App.SolutionsCollection = Backbone.Collection.extend({
    model: App.Module,
    url: "/solutions.json",
    comparator: 'title'
});
App.TheoriesCollection = Backbone.Collection.extend({
    model: App.Module,
    url: "/theories.json",
    comparator: 'title'
});
// Collection of collections
App.ModulesCollection = Backbone.Collection.extend({
    model: App.Module,
    comparator: 'title'
});

// Load the collections & models from the bootstrapped data
App.Stories = new App.StoriesCollection(stories);
App.Solutions = new App.SolutionsCollection(solutions);
App.Theories = new App.TheoriesCollection(theories);

// Add each collection to the collection of collections
App.Collections = [App.Stories, App.Solutions, App.Theories];
App.Modules = new App.ModulesCollection();
_.each(App.Collections, function(collection) {
    // Remember, add the *models* not the collection
    App.Modules.add(collection.models);
});

// ===================================================================
// Views
// ===================================================================
App.ModulesListView = Backbone.View.extend({
    el: false,
    collection: App.Modules,
    initialize: function(options) {
        // Listen to events on the collection
        this.listenTo(this.collection, "add remove sync", this.render);
    },
    template: "modules-list-template",
    serialize: function() {
        return {
            modules: this.collection
        };
    },
    beforeRender: function() {
        // Add the subviews to the view
        this.collection.each(function(module) {
            this.insertView("div#modules-list", new App.ModulesListItemView({
                model: module
            }));
        }, this);
    },
    afterRender: function() {
        $('body').attr("class", "modules-list-view");
    }
});

// Sub-view for a single item in the list
App.ModulesListItemView = Backbone.View.extend({
    initialize: function(options) {
        //console.log('ModulesListItemView initialized');
    },
    template: "modules-list-item-template",
    el: false,
    events: {
        // Listen for a click anywhere on the sub-view
        "click": "viewDetail"
    },
    viewDetail: function(e) {
        // Navigate to the detail view
        var name = this.model.get("slug");
        App.router.navigate('module/' + name, {
            trigger: true
        });
    }
});


App.ModuleDetailView = Backbone.View.extend({
    collection: new App.ModulesCollection(),
    initialize: function(options) {
        this.collection.reset();
        this.listenTo(this.collection, "add", this.render);
        //console.log('ModuleDetailView initialized');
        var relatedSolutions = this.model.get('related_solutions');
        var relatedTheories = this.model.get('related_theories');
        var relatedStories = this.model.get('related_stories');
        var relatedModules = relatedSolutions.concat(relatedStories).concat(relatedTheories);
        // console.log(relatedModules);
        var self = this;
        _.each(relatedModules, function(name) {
            //console.log(name);
            var module = App.Modules.findWhere({
                title: name
            });
            self.collection.add(module);
        });
    },
    template: "module-detail-template",
    events: {
        "click button.close-detail": "closeDetail",
        "click button.close-share": function(e) {
            this.$("#share").addClass("hide");
        }, // Simple function for this?
        "click button.toggle-share": function(e) {
            this.$("#share").toggleClass("hide");
        }, // Something that can read a bunch of
        "click button.close-learn-more": function(e) {
            this.$("#learn-more").addClass("hide");
        }, // actions off classes, for example?
        "click button.toggle-learn-more": function(e) {
            this.$("#learn-more").toggleClass("hide");
        }, // class="auto-events close-share open-learn-more"
        //"click button.auto-events": "autoEventHandler",
    },
    closeDetail: function(e) {
        // Navigate back to the start view
        App.router.navigate('', {
            trigger: true
        });
    },
    beforeRender: function() {
        // Add the subviews to the view
        this.collection.each(function(module) {
            this.insertView("#related-list", new App.ModulesListItemView({
                model: module
            }));
        }, this);

    },
    afterRender: function() {
        $('body').attr("class", "module-detail-view");
    }
});


// ===================================================================
// Layouts
// ===================================================================
App.Layout = new Backbone.Layout({
    // Attach the Layout to the main container.
    el: "body"
});


// ===================================================================
// Router
// ===================================================================
App.Router = Backbone.Router.extend({
    collection: App.Modules,
    initialize: function(options) {},
    routes: {
        '': 'start',
        'module(/:name)': 'displayModule',
        '*default': 'defaultRoute'
    },
    start: function() {
        App.Layout.setView("#content", new App.ModulesListView());
        App.Layout.render();
    },
    displayModule: function(name) {
        var model = this.collection.findWhere({
            "slug": name
        });
        if (model) {
            // Curious where the collection of related modules should be aggregated in order to insert the nested views
            App.Layout.setView("#content", new App.ModuleDetailView({
                model: model
            }));
            App.Layout.render();
        } else {
            this.defaultRoute();
        }
    },
    defaultRoute: function() {
        console.log("404");
    }
});
