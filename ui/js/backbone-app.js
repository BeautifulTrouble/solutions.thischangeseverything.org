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
    //prefix: "/ui/templates/",
    // Not using prefix because the templates are compilted at JST['template-name']
    // and setting prefix here looks for them with the prefix prepended.

    // This method will check for prebuilt templates first and fall back to
    // loading in via AJAX.
    fetchTemplate: function(path) {
        // Check for a global JST object.  When you build your templates for
        // production, ensure they are all attached here.
        var JST = window.JST || {};

        // If the path exists in the object, use it instead of fetching remotely.
        if (JST[path]) {
            return JST[path];
        }

        // If it does not exist in the JST object, mark this function as
        // asynchronous.
        var done = this.async();

        // Fetch via jQuery's GET.  The third argument specifies the dataType.
        $.get('/ui/templates/' + path + '.jst.ejs', function(contents) {
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
    //  navTo('tag/', this);
    //  navTo('idealab/published/', this);
    var slug = context ? context.model.get("slug") : "",
    prefix = prefix ? prefix : "";
    App.router.navigate(prefix + slug, {
        trigger: true
    });
};


// ===================================================================
// Models
// ===================================================================
App.Module = Backbone.Model.extend({
    initialize: function() {
    }
});

// API Models
App.APIModel = Backbone.Model.extend({
    parse: function(response) { 
        // When called by corresponding APICollection.parse, the 
        // data attribute will have already been plucked out
        return "data" in response ? response['data'] : response;
    },
    validate: function(attrs, options) {
        // API should always return {'success': true}, which is how we tell
        // incoming server data from data we generated here in backbone.
        // Models which don't define validator [suffix: -or] are ignored.
        if (attrs.success || !this.validator) return;
        var empties = _.object(_.map(_.pairs(attrs), function (pair) {
            return [pair[0], pair[1].trim() == ""];
        }) );
        var err = this.validator(attrs, empties, options);
        if (!this.validEmail(attrs.contact)) err.contact = "Please provide a real email address";
        if (_.isEmpty(err)) return;
        return err;
    },
    validEmail: function(email) {
        var blank = /^\s*$/;
        var valid = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (blank.test(email)) return false;
        if (valid.test(email)) return true;
        return false;
    }
});
App.LastPOST = App.APIModel.extend({
    urlRoot: "/api/last"
});
App.User = App.APIModel.extend({
    urlRoot: "/api/me"
});
App.Idea = App.APIModel.extend({
    urlRoot: "/api/ideas",
    validator: function (attrs, empties, options) {
        var err = {};
        if (empties.title) err.title = "This idea needs a title";
        if (empties.short_write_up) err.short_write_up = "Looks like you forgot to write the idea iteself";
        return err;
    }
});
App.Improvement = App.APIModel.extend({
    urlRoot: "/api/improvements",
    validator: function(attrs, empties, options) {
        var err = {}
        if (empties.content && empties.link) {
            err.content = "Give us something to work with!";
            err.link = "We'll settle for one of these";
        }
        return err;
    }
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

// API Collections
App.APICollection = Backbone.Collection.extend({
    parse: function(response) {
        return response['data'];
    }
});
App.IdeasCollection = App.APICollection.extend({
    model: App.Idea,
    url: "/api/ideas",
    comparator: "title"
});
App.ImprovementsCollection = App.APICollection.extend({
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
    selectedTag: '',
    filters: [],
    initialize: function(options) {
        // Listen to events on the collection
        this.listenTo(this.collection, "add remove sync", this.render);
        this.tags = _.sortBy(_.unique(_.flatten(this.collection.pluck("tags"))), function (name) {return name});
    },
    template: "modules-list-template",
    serialize: function() {
        return {
            modules: this.collection,
            tags: this.tags
        };
    },
    events: {
        'click .reset':  "resetFilters",
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
        // Responsive ImageMaps, if you can believe it
        $('img[usemap]').rwdImageMaps();
        // Set-up the filter control DOM
        this.filterControl = $('#modules-gallery ul li');
        // Crazy-ass Isotope + Lazy Load shiz
        var $window = $(window);
        this.tiles = $('.lazy');
        this.tiles.lazyload({
            failure_limit: Math.max(this.tiles.length-1, 0),
            effect : "fadeIn"
        });
        this.container = $('#modules-list');
        this.container.isotope({
            // options
            itemSelector: '.module-list-item',
            layoutMode: 'masonry',
            getSortData: {
                type: '[data-category]',
                title: '.caption .title'
            },
            sortBy: "random",
        });
        this.container.isotope( 'on', 'layoutComplete', function( isoInstance, laidOutItems ) {
            $window.trigger("scroll");
        });
        if ( this.selectedTag ) {
            // filter by tag
            this.container.isotope({ filter: '.' + this.selectedTag });
            $("select#filter-passion").val(this.selectedTag);
            $("select#filter-passion").addClass("highlight");
            $('.reset').removeClass('active'); // Turn off the "All" option
            this.container.isotope('layout'); // Trigger layout to lazy load to work
        } else { 
            // Do the default, sortBy: random
           this.container.isotope({ sortBy: "random" });
           this.container.isotope('layout'); // Trigger layout to lazy load to work
        }
    },
    resetFilters: function(e) {
        $('.filter.active').removeClass('active');
        $('.reset').addClass('active'); // Turn on the "All" option
        $("select#filter-passion")[0].selectedIndex = 0;
        $("select#filter-passion").removeClass("highlight");
        this.filters = [];
        this.setFilters();
    },
    filterList: function(e) {
        // TODO Need to clean this up a lot
        // currently, the filters are additive.
        // It should work that once the tag filter is activated
        // the type filters actually become subtractive.
        $('.reset').removeClass('active'); // Turn off the "All" option
        var elem = e.currentTarget;
        if ( elem.nodeName === 'SELECT') {
            if ( $( elem ).val() === 'What are you passionate about') {
                this.resetFilters();
            }
            else {
                $("select#filter-passion option").removeClass("active");
                $("select#filter-passion option:selected").addClass("active");               
                $("select#filter-passion").toggleClass("highlight");
            }
        } else {
            $( e.currentTarget ).toggleClass("active");
        }
        var actives = $('.filter.active');
        this.filters = _.map(actives, function(active) { 
            return $(active).attr('data-filter');            
        });
        this.setFilters();
    },
    setFilters: function() {
        this.container.isotope({filter: this.filters.join() });   
    }
});

// Sub-view for a single item in the list
App.ModulesListItemView = Backbone.View.extend({
    initialize: function(options) {
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
        var relatedSolutions = this.model.get('related_solutions');
        var relatedTheories = this.model.get('related_theories');
        var relatedStories = this.model.get('related_stories');
        var relatedModules = relatedSolutions.concat(relatedStories).concat(relatedTheories);
        var self = this;
        _.each(relatedModules, function(name) {
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
        "click .tags li": "viewTag"
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
    viewTag: function(e) {
        var tagName = $( e.currentTarget ).attr('data-filter');
        navTo('tag/' + tagName);
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
    values: App.Values,
    initialize: function(options) {
        this.collection.reset();
        this.listenTo(this.collection, "add", this.render);
        var relatedSolutions = this.model.get('related_solutions');
        var relatedTheories = this.model.get('related_theories');
        var relatedStories = this.model.get('related_stories');
        var relatedModules = relatedSolutions.concat(relatedStories).concat(relatedTheories);
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
        $('.lazy').lazyload({
            effect : "fadeIn"
        });
        this.$('.icon-share').popover({ 
            html : true, 
            placement: 'top',
            content: function() {
                return $('#share-popover').html();
        }});
    }
});

// IdeaLab views
App.IdeaLabView = Backbone.View.extend({
    // This view's entire purpose in life is to contain 
    // two sub-views: mainView and sideView
    template: "idealab-template",
    initialize: function(options) {
        this.mainView = options.mainView;
        this.mainView.parentView = this;
        this.sideView = options.sideView;
        this.sideView.parentView = this;
    },
    beforeRender: function() {
        this.insertView('#idealab-main', this.mainView);
        this.insertView('#idealab-sidebar', this.sideView);
    }
});

App.FormHelper = Backbone.View.extend({
    // All the nasty logic needed to deal with form submission 
    // and displaying multiple states within a view.
    // 
    // Example use:
    //  this.saveFormAs('form.idea', App.Idea);
    // Creates an instance of App.Idea and deals with toggling 
    // the three states: done, fail, and login
    //
    // Example use:
    //  this.setState();
    //  this.setState('done');
    //  this.setState('fail');
    //  this.setState('arbitrary');
    // Toggles between elements with markup like this:
    //  <div id="something">Default screen</div>
    //  <div id="something-done" class="hidden">Success screen</div>
    //  <div id="something-fail" class="hidden">Fail screen</div>
    //  <div id="something-arbitrary" class="hidden">...</div>
    baseStateSelector: '',
    serverError: '.server-error',
    fieldError: '.field-error',
    states: 'done fail login',
    contactFields: ['name', 'contact'],
    setFieldErrors: function(obj) {
        _.each(obj.validationError, function(text, field) {
            this.$('form [name=' + field + '] + ' + this.fieldError).text(text);
        }, this);
        obj.validationError = null;
    },
    clearFieldErrors: function() {
        this.$('form ' + this.fieldError).text('');
    },
    setState: function(state) {
        this.clearFieldErrors();
        // TODO: Revisit this whole concept when not tired
        // Show/Hide base depending on state
        this.$(this.baseStateSelector)[state ? 'addClass' : 'removeClass']('hidden');
        // Show/Hide the -suffixed elements
        var states = this.states.match(/\S+/g);
        _.each(states, function (s) {
            this.$(this.baseStateSelector + '-' + s)[
                s == state ? 'removeClass' : 'addClass'
            ]('hidden');
        }, this);
    },
    saveFormAs: function(formSelector, Model) { 
        this.clearFieldErrors();
        var form = {};
        _.each($(formSelector).serializeArray(), function(field) {
            form[field.name] = field.value;
        });
        var obj = new Model(form);
        if (obj.isValid()) {
            obj.save(null, {
                success: this.done || this._done, 
                error: this.fail || this._fail,
                context: this
            }); 
        } else {
            this.setFieldErrors(obj);
        }
    },
    _done: function(model, response, options) { 
        var self = options.context;
        self.setState('done'); 
        new App.LastPOST().save();  // Absurd
        // TODO: THIS is purportedly what backbone DOES and I'm calling it manually. Gross.
        try { self.parentView.mainView.submitted.fetch({reset: true}); } catch(e) { }
    },
    _fail: function(model, response, options) {
        var self = options.context;
        var err = response.message ? response.message : 'API Unavailable';
        var code = response.status ? response.status : 500;
        if (code == 401) {
            self.setState('login');
        } else {
            self.setState('fail');
            self.$(self.serverError).text(code + ": " + err);
        }
    },
    afterRender: function() {
        // Insert name/contact into forms if we have them
        var self = this;
        this.user = new App.User();
        this.user.fetch({success: _.bind(this.loggedIn, this), error: _.bind(this.loggedOut, this)});
        // Add next parameter to login/logout buttons
        this.$('a.login, a.logout').each(function () {
            var next = (this.href.indexOf('?') != -1) ? '&next=' : '?next=';
            this.href = this.href + next + window.location.pathname + '%23' + Backbone.history.fragment;
        });
        // If there was form data and we lost it to an error or redirect...
        var last = new App.LastPOST();
        last.fetch({success: function() {
            // _.omit: Prefer what's on the server, so people see what we have stored
            //_.each(_.omit(last.attributes, self.contactFields), function(value, key) {
            _.each(last.attributes, function(value, key) {
                this.$('form [name=' + key + ']').val(value);
            }, self);
        } });
    },
    loggedIn: function() {
        // Could be called "loggedIn" but it's named this way because of some confusing semantics
        _.each(this.contactFields, function(name) {
            this.$('form [name=' + name + ']').val(this.user.attributes[name]);
        }, this);
        this.$('.logout-hack').removeClass('hidden');
    },
    loggedOut: function() {
        // Could be called "loggedOut" but it's named this way because of some confusing semantics
        this.$('form [name=name], form [name=contact]').val("");
        this.$('.logout-hack').addClass('hidden');
    }
});
App.IdeaLabIdeaView = App.FormHelper.extend({
    template: "idealab-idea-template",
    baseStateSelector: '#idealab-idea',
    events: {
        "click input.add-idea": function () { 
            this.saveFormAs('form#add-idea', App.Idea);
        },
        "click button.add-another": function () { this.render(); },
        "click .logout-hack": function () { 
            $.ajax('/api/logout', {success: _.bind(this.loggedOut, this), error: _.bind(this.loggedIn, this)});
        }
    }
});
App.IdeaLabImprovementView = App.FormHelper.extend({
    template: "idealab-improvement-template",
    baseStateSelector: '#idealab-improvement',
    events: {
        'click button[class^="add-a"]': function (e) { 
            // Why is this not one line of jQuery?
            var $button = this.$(e.currentTarget);
            if ($button.hasClass('selected')) {
                $button.removeClass('selected');
                $button.next('form').addClass('hidden');
            } else {
                this.$('form').addClass('hidden');
                this.$('button').removeClass('selected');
                $button.addClass('selected').next('form').removeClass('hidden');
            }
            this.clearFieldErrors(); // Normally automatic when you use proper views.
        },
        "click input.add-an-example": function () { this.saveForm('add-an-example'); },
        "click input.add-a-resource": function () { this.saveForm('add-a-resource'); },
        "click input.add-a-question": function () { this.saveForm('add-a-question'); },
        "click button.add-another": function () { this.render(); },
        "click .logout-hack": function () { 
            $.ajax('/api/logout', {success: _.bind(this.loggedOut, this), error: _.bind(this.loggedIn, this)});
        }
    },
    saveForm: function (s) {
        this.saveFormAs('form#' + s, App.Improvement);
    },
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
    setState: function(state) {
        App.router.navigate('idealab/' + state);
        this.state = state;
        this.render();
    },
    events: {
        "click #idealab-published tr.data-slug": function (e) { 
            navTo('idealab/published/' + e.currentTarget.dataset.slug);
        },
        // :not(.submitted) is the moderation^2 thing TODO:TODO:TODO
        "click #idealab-submitted tr:not(.submitted).data-slug": function (e) { 
            navTo('idealab/submitted/' + e.currentTarget.dataset.slug);
        },
        "click span.published": function () { this.setState('published'); },
        "click span.submitted": function () { this.setState('submitted'); }
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
        "click button.view-gallery": function() { navTo(); },
        "click button.view-published-idea": function() { navTo('module/', this); },
        "click button.view-all-published-ideas": function() { navTo('idealab/published'); },
        "click button.view-all-submitted-ideas": function() { navTo('idealab/submitted'); },
        "click .tags li": function(e) {
            var tagName = $( e.currentTarget ).attr('data-filter');
            navTo('tag/' + tagName);
        }
    },
    afterRender: function() {
        $('body').attr("class", "idealab-detail-view");
        this.$('.icon-share').popover({ 
            html : true, 
            placement: 'top',
            content: function() {
                return $('#share-popover').html();
            }});
    }
});

// Site-wide views
App.HeaderView = Backbone.View.extend({
    template: "header",
    events: {
        //'click .bsol h1': function() { navTo(); },
        'click .icon-gallery': function() { navTo(); },
        'click .icon-lab': function() { navTo('idealab'); }
    }
});

App.FooterView = Backbone.View.extend({
    template: "footer"
});

App.AboutView = Backbone.View.extend({
    template: "about",
    afterRender: function() {
        $('body').attr("class", "about-view");
    }
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
    initialize: function() { 
        // Track every route and call trackPage
        this.bind('route', this.trackPageView);
    },
    routes: {
        '': 'start',
        'module(/:name)': 'displayModule',
        'value(/:name)': 'displayValue',
        'tag(/:name)': 'displayTag',
        'idealab(/:state)': 'displayIdeaLabList',
        'idealab/published(/:name)': 'displayIdeaLabPublishedDetail',
        'idealab/submitted(/:name)': 'displayIdeaLabSubmittedDetail',
        'about': 'displayAbout',
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
            App.Layout.setView("#content", new App.ModuleDetailView({
                model: model
            }));
            App.Layout.render();
        } else {
            this.defaultRoute();
        }
        // TODO Improve this lame fix for window positioning issue
        window.scrollTo(0, 0);
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
    displayTag: function(name) {
        App.Layout.setView("#content", new App.ModulesListView({selectedTag: name}) );
        App.Layout.render();
    },
    displayIdeaLabList: function(state) {
        if (state != 'published' && state != 'submitted') {
            state = 'submitted';
        }
        App.router.navigate('idealab/' + state, {replace: true});
        App.Layout.setView('#content', new App.IdeaLabView({
            mainView: new App.IdeaLabListView({state: state}),
            sideView: new App.IdeaLabIdeaView()
        }) );
        App.Layout.render();
    },
    displayIdeaLabPublishedDetail: function(name) {
        var model = this.collection.findWhere({slug: name});
        if (model) {
            App.Layout.setView('#content', new App.IdeaLabView({
                mainView: new App.IdeaLabDetailView({
                    model: model,
                    state: 'published'
                }),
                sideView: new App.IdeaLabImprovementView({model: model})
            }) );
            App.Layout.render();
        } else {
            this.defaultRoute();
        }
    },
    displayIdeaLabSubmittedDetail: function(name) {
        var collection = new App.IdeasCollection();
        collection.fetch()
            .done(function() {
                var model = collection.findWhere({slug: name});
                if (model) {
                    App.Layout.setView('#content', new App.IdeaLabView({
                        mainView: new App.IdeaLabDetailView({
                            model: model,
                            state: 'submitted'
                        }),
                        sideView: new App.IdeaLabImprovementView({model: model})
                    }) );
                    App.Layout.render();
                } 
            })
            .fail(this.defaultRoute);
    },
    displayAbout: function() {
            App.Layout.setView("#content", new App.AboutView());
            App.Layout.render();
    },
    defaultRoute: function() {
        console.log("404");
    },
    trackPageView: function() {
        var url = Backbone.history.getFragment();
        // Add a slash if neccesary
        if (!/^\//.test(url)) url = '/' + url;
        // Record page view
        ga('send', {
            'hitType': 'pageview',
            'page': url
        });
    }
});
