/* App JS */
// Libraries concatenated & compressed by by jekyll-assets pipeline
//= require backbone.js
//= require backbone.layoutmanager.js

window.App = {};

// Use the backbone.layoutmanager 
// turn it on for all views by default
Backbone.Layout.configure({
    manage: true
});

// ===================================================================
// Models
// ===================================================================
App.Module = Backbone.Model.extend({
    initialize: function () {
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
_.each(App.Collections, function(collection){
    // Remember, add the *models* not the collection
    App.Modules.add(collection.models);
});

// ===================================================================
// Views
// ===================================================================
App.ModulesListView = Backbone.View.extend({
    el: false,
    collection: App.Modules,
    initialize: function (options) {
        // Listen to events on the collection
        this.listenTo(this.collection, "add remove sync", this.render);
    },
    template: "#modules-list-template",
    serialize: function() {
        return { modules: this.collection };
    },
    beforeRender: function() {
        // Add the subviews to the view
        this.collection.each(function(module) {
            this.insertView("div#modules-list", new App.ModulesListItemView({
                model: module
            }));
        }, this);
    }
});

// Sub-view for a single item in the list
App.ModulesListItemView = Backbone.View.extend({
    initialize: function (options) {
        //console.log('ModulesListItemView initialized');
    },
    template: "#modules-list-item-template",
    el: false,
    events: {
        // Listen for a click anywhere on the sub-view
        "click": "viewDetail"
    },
    viewDetail: function(e) {
        // Navigate to the detail view
        var name = this.model.get("slug");
        App.router.navigate('module/' + name, {trigger: true});
    }
});


App.ModuleDetailView = Backbone.View.extend({
    initialize: function (options) {
        //console.log('ModuleDetailView initialized');
    },
    template: "#module-detail-template",
    events: {
        "click button.close-detail": "closeDetail",
        "click button.close-share":         function(e) { this.$("#share").addClass("hide"); },         // Simple function for this?
        "click button.toggle-share":        function(e) { this.$("#share").toggleClass("hide"); },      // Something that can read a bunch of
        "click button.close-learn-more":    function(e) { this.$("#learn-more").addClass("hide"); },    // actions off classes, for example?
        "click button.toggle-learn-more":   function(e) { this.$("#learn-more").toggleClass("hide"); }, // class="auto-events close-share open-learn-more"
        //"click button.auto-events": "autoEventHandler",
    },
    closeDetail: function(e) {
        // Navigate back to the start view
        App.router.navigate('', {trigger: true});
    },
    beforeRender: function() {
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
    initialize: function(options){
    },
    routes: {
        '' : 'start',
        'module(/:name)' : 'displayModule',
        '*default': 'defaultRoute'
    },
    start: function() {
        App.Layout.setView("#content", new App.ModulesListView() );
        App.Layout.render();
    },
    displayModule: function(name){
        var model = this.collection.findWhere({"slug": name});
        if ( model ) {
            // Curious where the collection of related modules should be aggregated in order to insert the nested views
            App.Layout.setView("#content", new App.ModuleDetailView({ model: model }) );
            App.Layout.render();
        } else {
            this.defaultRoute();
        }
    },
    defaultRoute: function() {
        console.log("404");
    }
});

