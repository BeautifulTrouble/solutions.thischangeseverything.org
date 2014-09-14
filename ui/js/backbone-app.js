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
// Utilities
// ===================================================================
var navTo = function(prefix, context) {
    // Examples:
    //  navTo();
    //  navTo('about');
    //  navTo('module/', this);
    //  navTo('value/', this);
    //  navTo('idealab/published/', this);
    var slug = context ? context.model.get("slug") : "",
    prefix = prefix ? prefix : "";
    App.router.navigate(prefix + slug, {
        trigger: true
    });
};

var getForm = function(jForm) {
    // Example use:
    // var idea = new App.Idea(getFormFields(this.$('form#whatever')));
    // idea.save();
    var results = {};
    $.each(jForm.serializeArray(), function(i, field) {
        results[field.name] = field.value;
    });
    return results;
};

// ===================================================================
// Models
// ===================================================================
App.Module = Backbone.Model.extend({
    initialize: function() {
        //console.log('Initialized a Module model');
    }
});

App.IdeaLabModule = Backbone.Model.extend({
    parse: function(response) { 
        return "data" in response ? response['data'] : response;
    }
});
App.Idea = App.IdeaLabModule.extend({
    urlRoot: "/api/ideas"
});
App.Improvement = App.IdeaLabModule.extend({
    urlRoot: "/api/improvements"
});

// ===================================================================
// Collections
// ===================================================================
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
App.ValuesCollection = Backbone.Collection.extend({
    model: App.Module,
    url: "/values.json",
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
App.Values = new App.ValuesCollection(values);

// Add each collection to the collection of collections
App.Collections = [App.Stories, App.Solutions, App.Theories, App.Values];
App.Modules = new App.ModulesCollection();
_.each(App.Collections, function(collection) {
    // Remember, add the *models* not the collection
    App.Modules.add(collection.models);
});

// Make module tags available to app
//App.Tags = _.unique(_.flatten(App.Modules.pluck("tags")));

// IdeaLab Collections
App.IdeaLabCollection = Backbone.Collection.extend({
    parse: function(response) {
        return response['data'];
    }
});
App.IdeasCollection = App.IdeaLabCollection.extend({
    model: App.Idea,
    url: "/api/ideas"
});
App.ImprovementsCollection = App.IdeaLabCollection.extend({
    model: App.Improvement,
    url: "/api/improvements"
});


// ===================================================================
// Views
// ===================================================================

App.ModulesListView = Backbone.View.extend({
    //el: false,
    collection: App.Modules,
    tags: '',
    initialize: function(options) {
        // Listen to events on the collection
        this.listenTo(this.collection, "add remove sync", this.render);
        this.tags = _.unique(_.flatten(this.collection.pluck("tags")));
    },
    template: "modules-list-template",
    serialize: function() {
        return {
            modules: this.collection,
            tags: this.tags
        };
    },
    events: {
        'click .filter': "filterList",
        'change select#filter-passion': "filterList"
    },
    beforeRender: function() {
        // Add the subviews to the view
        this.collection.each(function(module) {
            this.insertView("#modules-list", new App.ModulesListItemView({
                model: module
            }));
        }, this);
    },
    afterRender: function() {
        $('body').attr("class", "modules-list-view");
        this.container = $('#modules-list');
        this.container.isotope({
            // options
            itemSelector: '.module-list-item',
            layoutMode: 'masonry',
            getSortData: {
                type: '[data-category]',
                title: '.caption .title'
            },
            sortBy: 'random'
        });
        this.filterControl = $('#modules-gallery ul li');
    },
    filterList: function(e) {
        this.filterControl.removeClass("active");
        var user_filter = $( e.currentTarget ).attr("data-filter") || $( e.currentTarget ).val();
        $( e.currentTarget ).addClass("active");
        if ( user_filter ) {
            this.container.isotope({filter: user_filter});   
        }
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
    viewDetail: function() { 
        var type = this.model.get("type");
        if ( type === 'value' ) {
            navTo('value/', this);
        } else {
            navTo('module/', this); 
        }
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
        "click .values li": "viewValue",
        "click button.improve-this": "improveThis",
    },
    closeDetail: function(e) { navTo(); },
    improveThis: function(e) { navTo('idealab/published/', this); },
    viewValue: function(e) { 
        var valueName = e.currentTarget.innerHTML;
        var value = App.Values.findWhere({title: valueName});
        if ( value ) {
            var slug = value.get("slug");
            navTo('value/' + slug); 
        } else {
            console.log('TODO');
        }
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
        $('.icon-share').popover({ 
            html : true, 
            placement: 'top',
            content: function() {
              return $('#share-popover').html();
        }});
    }
});

App.ValueDetailView = Backbone.View.extend({
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
            var module = App.Modules.findWhere({
                title: name
            });
            self.collection.add(module);
        });
    },
    template: "value-detail-template",
    events: {
        "click button.close-detail": "closeDetail",
    },
    closeDetail: function(e) { navTo(); },
    beforeRender: function() {
        // Add the subviews to the view
        this.collection.each(function(module) {
            this.insertView("#related-list", new App.ModulesListItemView({
                model: module
            }));
        }, this);
    },
    afterRender: function() {
        $('body').attr("class", "value-detail-view");
        var container = $('#related-list');
        container.isotope({
            itemSelector: '.module-list-item',
            layoutMode: 'fitRows'
        });
    }
});


App.IdeaLabListView = Backbone.View.extend({
    template: "idealab-list-template",
    initialize: function(options) {
        this.state = options.state;
        this.published = App.Modules;
        this.submitted = new App.IdeasCollection();
        // Better yet, how can I defer rendering this until the collection fetches?
        this.listenTo(this.submitted, "reset", this.render);
        this.submitted.fetch({reset: true});
    },
    serialize: function() { 
        return {
            state: this.state,
            published: this.published,
            submitted: this.submitted
        }
    },
    events: {
        "click #idealab-published tr.data-slug": function (e) { 
            navTo('idealab/published/' + e.currentTarget.dataset.slug);
        },
        "click #idealab-submitted tr.data-slug": function (e) { 
            navTo('idealab/submitted/' + e.currentTarget.dataset.slug);
        },
        "click span.published": function () { navTo('idealab/published'); },
        "click span.submitted": function () { navTo('idealab/submitted'); },
        "click input.add-idea": function () { 
            var idea = new App.Idea(getForm(this.$('form')));
            idea.save()
            .done(function () {
                console.log('Saved.');
            })
            .fail(function () {
                console.log('Not Saved.');
            });
        }
    },
    afterRender: function() {
        $('body').attr("class", "idealab-list-view");
    }
});
App.IdeaLabDetailView = Backbone.View.extend({
    template: "idealab-detail-template",
    initialize: function(options) {
        this.state = options.state;
        this.model = options.model;
    },
    serialize: function() { 
        return _.extend(this.model.attributes, {
            state: this.state, 
        }); 
    },
    events: {
        "click button.view-published-idea": function() { navTo('module/', this); },
        "click button.view-gallery": function() { navTo(); },
        "click button.view-all-published-ideas": function() { navTo('idealab/published'); },
        "click button.view-all-submitted-ideas": function() { navTo('idealab/submitted'); }
    },
    afterRender: function() {
        /*
        // TODO: google oauth refuses these redirects :( ...so use an ajaxier approach
        this.$('a.login').each(function () {
            var next_param = (this.href.indexOf('?') != -1) ? '&next=' : '?next=';
            this.href = this.href + next_param + window.location.pathname + '%23' + Backbone.history.fragment;
        });
        */
        $('body').attr("class", "idealab-detail-view");
        this.$('.icon-share').popover({ 
            html : true, 
            placement: 'top',
            content: function() {
              return $('#share-popover').html();
        }});
    }
});


App.HeaderView = Backbone.View.extend({
    template: "header",
    events: {
        'click .bsol h1': function() { navTo(); },
        'click .icon-gallery': function() { navTo(); },
        'click .icon-lab': function() { navTo('idealab'); }
    }
});

App.FooterView = Backbone.View.extend({
    template: "footer"
});

// ===================================================================
// Layouts
// ===================================================================
App.Layout = new Backbone.Layout({
    // Attach the Layout to the main container.
    el: "body",
    views: {
        "header": new App.HeaderView(),
        "footer": new App.FooterView()
    }
});


// ===================================================================
// Router
// ===================================================================

App.Router = Backbone.Router.extend({
    collection: App.Modules,
    routes: {
        '': 'start',
        'module(/:name)': 'displayModule',
        'value(/:name)': 'displayValue',
        'idealab': 'displayIdeaLab',
        'idealab/:state(/:name)': 'displayIdeaLab',
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
    displayValue: function(name) {
        var model = this.collection.findWhere({
            "slug": name
        });
        if (model) {
            App.Layout.setView("#content", new App.ValueDetailView({
                model: model
            }));
            App.Layout.render();
        } else {
            this.defaultRoute();
        }
    },
    displayIdeaLab: function(state, name) {
        if (!state && !name) { state = 'published'; }
        if (state == 'submitted') {
            // Where else can this awful async handler go? It's blocking the page rendering.
            var collection = new App.IdeasCollection();
            collection.fetch({
                done: function() { 
                    var model = collection.findWhere({slug: name});
                    var view = model ? new App.IdeaLabDetailView({model: model, state: state})
                                     : new App.IdeaLabListView({state: state});
                    App.Layout.setView("#content", view);
                    App.Layout.render();
                }
            });
        } else {
            var model = this.collection.findWhere({slug: name});
            var view = model ? new App.IdeaLabDetailView({model: model, state: state})
                             : new App.IdeaLabListView({state: state});
            App.Layout.setView("#content", view);
            App.Layout.render();
        }
    },
    defaultRoute: function() {
        console.log("404");
    }
});
