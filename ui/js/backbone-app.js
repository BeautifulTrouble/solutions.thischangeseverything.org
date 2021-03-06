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
var nl2ip = function(string, classes) {
    // nl2ip: newlines2innerparagraphs
    //var p = /(?:\r\n|\r|\n){2}/g;    // Does this make more sense?
    var p = /(?:\r\n\r\n|\r\r|\n\n)/g;
    var br = /(?:\r\n|\r|\n)/g;
    string = string.replace(p, classes ? '</p><p class="' + classes + '">' : '</p><p>');
    string = string.replace(br, '<br>');
    return string;
};

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

var JSONStorage = function(store, prefix) {
    // Example:
    //  Local = JSONStorage(typeof localStorage !== "undefined" ? localStorage : {});
    //  Local('x', [1,2,3,4]);
    //  Local('x');
    prefix = prefix || '';              // Namespace all the values with this
    empty = 'null';                     // Valid JSON string for non-existent keys
    return function (key, value) {
        if (value === void 0) return JSON.parse(store[prefix + key] || empty); 
        store[prefix + key] = JSON.stringify(value); 
    };
};
var Local = JSONStorage(typeof localStorage !== "undefined" ? localStorage : {});
var Session = JSONStorage(typeof sessionStorage !== "undefined" ? sessionStorage : {});

var ensureLoggedIn = function (callbacks) {
    // App.currentUser is currently instantiated by App.HeaderView
    App.currentUser && App.currentUser.fetch(callbacks || {});
};
var logOut = function () {
    // App.currentUser is currently instantiated by App.HeaderView
    $.ajax('/api/logout');
    App.currentUser && App.currentUser.unset('name');
};

App.updateMeta = function(model) {
    var title = model.get('title');
    var image = model.get('images');
    var summary = model.get('summary');
    image = image[0].url;
    var img_path = '/full_images/';
    var path  = model.get('href');
    var url = domain + path;
    if ( title && summary && image && url ) {
        $('title').remove();
        $('meta[property="og:title"]').remove();
        $('meta[property="DC.title"]').remove();
        $('meta[name="twitter:title"]').remove();
        $('meta[name="description"]').remove();
        $('meta[property="DC.description"]').remove();
        $('meta[property="og:description"]').remove();
        $('meta[name="twitter:description"]').remove();
        $('meta[property="og:image"]').remove();
        $('meta[property="og:image:url"]').remove();
        $('meta[name="twitter:image:src"]').remove();
        $('meta[property="og:url"]').remove();
        $('link[rel="canonical"]').remove();
        $("head").append('<title>' + title + '</title>');
        $("head").append('<meta property="og:title" content="' + title + ' | Beautiful Solutions">');
        $("head").append('<meta name="twitter:title" content="' + title + '">');
        $("head").append('<meta property="og:description" content="' + summary + '">');
        $("head").append('<meta name="description" content="' + summary + '">');
        $("head").append('<meta name="twitter:description" content="' + summary + '">');
        $("head").append('<meta property="og:image" content="' + domain + img_path + image + '">');
        $("head").append('<meta property="og:image:url" content="' + domain + img_path + image + '">');
        $("head").append('<meta name="twitter:image:src" content="' + domain + img_path + image + '">');
        $("head").append('<meta property="og:url" content="' + url + '">');   
        $("head").append('<link rel="canonical" href="' + url + '">');
    }
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
        // Models which don't define a function called validator are ignored.
        if (attrs.success || !this.validator) return;
        var empties = _.object(_.map(_.pairs(attrs), function (pair) {
            return [pair[0], pair[1].trim() == ""];
        }) );
        var err = this.validator(attrs, empties, options);
        if (!this.validEmail(attrs.contact)) {
            err.contact = "Please provide a real email address";
        }
        if (_.isEmpty(err)) return;
        return err;
    },
    validEmail: function(email) {
        var valid = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (valid.test(email)) {
            return true;
        }
    }
});
App.User = App.APIModel.extend({
    urlRoot: "/api/me",
});
App.Idea = App.APIModel.extend({
    urlRoot: "/api/ideas",
    validator: function (attrs, empties, options) {
        var err = {};
        if (empties.title) {
            err.title = "This idea needs a title";
        }
        if (empties.short_write_up) {
            err.short_write_up = "Looks like you forgot to write the idea itself";
        }
        return err;
    }
});
App.IdeaVote = App.APIModel.extend({
    urlRoot: "/api/love/idea"
});
App.Improvement = App.APIModel.extend({
    urlRoot: "/api/improvements",
    validator: function(attrs, empties, options) {
        var err = {};
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
    // TODO: Move this to all App.*Collection types
    model: App.Module,
    comparator: function(a, b) {
        // This comparator function does backward sorting when a name is prefixed w/-
        // For example, sortKey: '-title' sorts titles Z-A
        var key = this.sortKeyName();
        if (this.sortIsBackward()) {
            var A = b.get(key), B = a.get(key);
        } else {
            var A = a.get(key), B = b.get(key);
        } // Perform the ancient sorting rite
        return A > B ? 1 : (A < B ? -1 : 0);
    },
    sortKey: 'title',
    sortKeyName: function() { return this.sortKey.replace(/^-/, ''); },
    sortIsBackward: function() { return /^-/.test(this.sortKey); },
    sortCollectionBy: function(key) {
        var key = key || 'title';
        if (this.sortKey == key) {
            key = this.sortIsBackward() ? this.sortKeyName() : '-' + key;
        }
        this.sortKey = key;
        this.sort();
    }
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
App.APICollection = App.ModulesCollection.extend({
    parse: function(response) {
        return response['data'];
    }
});
App.IdeasCollection = App.APICollection.extend({
    model: App.Idea,
    url: "/api/ideas"
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
            sortBy: "random"
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
        // Update the meta information for this module
        // ... for sharing! 
        App.updateMeta( this.model );
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
        "click button.close-detail": "closeDetail"
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
    template: "idealab-template",
    initialize: function () {
        // Make this act like a backbone method even when jQuery calls it
        this.showSide = _.bind(this.showSide, this);
    },
    beforeRender: function () {
        this.mainView.parentView = this;
        this.sideView.parentView = this;
        this.insertView('#idealab-main', this.mainView);
        this.insertView('#idealab-sidebar', this.sideView);
    },
    showSide: function(view) {
        this.prevSideView = this.sideView;
        this.sideView = new view();
        this.render();
    },
    unshowSide: function() {
        this.prevSideView || location.reload();
        this.sideView = this.prevSideView;
        this.render();
    }
});

// Idealab main views
App.IdeaLabListView = Backbone.View.extend({
    template: "idealab-list-template",
    initialize: function(options) {
        this.state = options.state;
        this.published = App.Modules;
        this.listenTo(this.published, "sort", this.render);
        this.submitted = new App.IdeasCollection();
        // Set default sorting to # of votes
        this.submitted.sortKey = '-date';
        // Better yet, how can I defer rendering this until the collection fetches?
        this.listenTo(this.submitted, "sort reset", this.render);
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
        // :not(.submitted) meaning "approved" (submitted idealab != submitted gallery)
        "click #idealab-submitted tr:not(.submitted).data-slug": function (e) { 
            navTo('idealab/submitted/' + e.currentTarget.dataset.slug);
        },
        "click span.published": function () { this.setState('published'); },
        "click span.submitted": function () { this.setState('submitted'); },
        "click #idealab-submitted thead th": function(e) {
            this.submitted.sortCollectionBy(e.currentTarget.dataset.sortBy);
            // XXX: I shouldn't have to call this manually but something about
            //      the way I insert views seems to break event listening.
            //      TODO: investigate layoutManager
            this.render();
        },
        "click #idealab-published thead th": function(e) {
            this.published.sortCollectionBy(e.currentTarget.dataset.sortBy);
            this.render();
        }
    },
    afterRender: function() {
        $('body').attr("class", "idealab-list-view");
        // TODO: setState renders each state switch, so get the collection from the state
        var sub = this.submitted.sortKeyName(), pub = this.published.sortKeyName();
        this.$('#idealab-submitted thead th[data-sort-by=' + sub + ']').addClass('selected');
        this.$('#idealab-published thead th[data-sort-by=' + pub + ']').addClass('selected');
        if (this.submitted.sortIsBackward()) {
            this.$('#idealab-submitted thead th[data-sort-by=' + sub + ']').addClass('backward');
        }
        if (this.published.sortIsBackward()) {
            this.$('#idealab-published thead th[data-sort-by=' + pub + ']').addClass('backward');
        }
    }
});

App.IdeaLabDetailView = Backbone.View.extend({
    template: "idealab-detail-template",
    initialize: function(options) {
        var that = this;
        this.state = options.state;
        this.model = options.model;
        // Since the App has global state, why load data on each page view?
        // I think some data binding is the crucial missing piece here,
        // because what I'm doing seems way too manual and clunky...
        this.improvements = new App.ImprovementsCollection();
        this.improvementset = [];
        //this.listenTo(this.improvements, "reset", this.render);
        this.improvements.fetch({reset: true}).done(function () {
            that.improvementset = that.improvements.where({module: that.model.get('slug')});
            that.render();
        });
    },
    serialize: function() { 
        return _.extend(this.model.attributes, {
            nl2ip: nl2ip,
            state: this.state, 
            improvements: this.improvementset || []
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
        },
        "click span.vote": function(e) {
            var self = this;
            var $el = this.$(e.currentTarget);
            ensureLoggedIn({
                error: _.partial(this.parentView.showSide, App.IdeaLabLoginView),
                success: function () {
                    new App.IdeaVote({id: self.model.id}).save(null, {
                        success: function() { $el.toggleClass('loved'); }
                    });
                }
            });
        }
    },
    afterRender: function() {
        $('body').attr("class", "idealab-detail-view");
        this.$('.icon-share').popover({ 
            html : true, 
            placement: 'top',
            content: function() { return $('#share-popover').html(); }
        });
    }
});

// Idealab sidebar views
App.IdeaLabFormMixer = Backbone.View.extend({
    // These form-handling functions should have only 2 external dependencies:
    // Local for localStorage and ensureLoggedIn for handling deciding between
    // two functions to call based on the existence of a User object.
    storeForm: function (selector) {
        // Store form values in localStorage
        var form = {};
        _.each($(selector).serializeArray(), function(field) {
            form[field.name] = field.value;
        });
        Local('form-' + selector, form);
    },
    restoreForm: function (selector) {
        // Restore [type!=hidden] form values from localStorage
        var form = this._getForm(selector);
        var restored = false;
        _.each(form, function(value, key) {
            var field = this.$(selector + ' [name=' + key + '][type!=hidden]');
            if (field && form[key]) {
                field.val(form[key]);
                restored = true;
            }
        }, this);
        // Return true if any form data was restored
        return restored;
    },
    showFormErrors: function(obj) {
        // After an attempted saveForm, this can be called to show errors
        _.each(obj.validationError, function(text, field) {
            this.$('form [name=' + field + '] + .field-error').text(text);
        }, this);
        obj.validationError = null;
    },
    hideFormErrors: function() {
        // Call freely to clear error fields
        this.$('form .field-error').text('');
    },
    saveForm: function (options) {
        // Don't confuse this with storeForm! Only saveForm saves to the database
        var self = this;
        var selector = options.selector;
        var model = options.model;
        var error = options.error || _.noop;
        var login = options.login || _.noop;
        var success = options.success || _.noop;
        this.hideFormErrors();
        this.storeForm(selector);
        ensureLoggedIn({
            error: login,
            success: function () {
                var object = new model(self._getForm(selector));
                if (object.isValid()) {
                    object.save(null, {
                        error: error,
                        success: function () {
                            self._forgetForm(selector);
                            success();
                        }
                    });
                } else {
                    self.showFormErrors(object);
                }
            }
        });
    },
    _getForm: function (selector) {
        return Local('form-' + selector) || {};
    },
    _forgetForm: function (selector) {
        Local('form-' + selector, null);
    }
});

App.IdeaLabIdeaView = App.IdeaLabFormMixer.extend({
    template: "idealab-idea-template",
    afterRender: function () {
        if (this.restoreForm('#add-idea')) {
            // If the form is valid and the user is logged in, auto-submit it.
            this.saveForm({
                selector: '#add-idea',
                model: App.Idea,
                success: _.partial(this.parentView.showSide, App.IdeaLabIdeaDoneView)
            });
        }
    },
    events: {
        "click .logout": logOut,
        "click input.add-idea": 'saveIdea'
    },
    saveIdea: function () {
        this.saveForm({
            selector: '#add-idea', 
            model: App.Idea, 
            error: _.partial(this.parentView.showSide, App.IdeaLabErrorView),
            login: _.partial(this.parentView.showSide, App.IdeaLabLoginView),
            success: _.partial(this.parentView.showSide, App.IdeaLabIdeaDoneView)
        });
    }
});

App.IdeaLabImprovementView = App.IdeaLabFormMixer.extend({
    template: "idealab-improvement-template",
    afterRender: function () {
        _.each(['#add-an-example', '#add-a-resource', '#add-a-question'], function(selector) {
            if (this.restoreForm(selector)) {
                // If the form is valid and the user is logged in, auto-submit it.
                this.saveForm({
                    selector: selector,
                    model: App.Improvement,
                    success: _.partial(this.parentView.showSide, App.IdeaLabImprovementDoneView)
                });
            }
        }, this);
    },
    events: {
        "click .logout": logOut,
        'click button[class^="add-a"]': function (e) { 
            this.hideFormErrors();
            // Do the button toggle dance...
            var $button = this.$(e.currentTarget);
            if ($button.hasClass('selected')) {
                $button.removeClass('selected');
                $button.next('form').addClass('hidden');
            } else {
                this.$('form').addClass('hidden');
                this.$('button').removeClass('selected');
                $button.addClass('selected').next('form').removeClass('hidden');
            }
        },
        "click input.add-an-example": function () { this.saveImprovement('#add-an-example') },
        "click input.add-a-resource": function () { this.saveImprovement('#add-a-resource') },
        "click input.add-a-question": function () { this.saveImprovement('#add-a-question') }
    },
    saveImprovement: function (selector) {
        this.saveForm({
            selector: selector,
            model: App.Improvement,
            error: _.partial(this.parentView.showSide, App.IdeaLabErrorView),
            login: _.partial(this.parentView.showSide, App.IdeaLabLoginView),
            success: _.partial(this.parentView.showSide, App.IdeaLabImprovementDoneView)
        });
    }
});

App.IdeaLabLoginView = Backbone.View.extend({
    template: "idealab-login-template",
    afterRender: function () {
        this.$('a.login').each(function () {
            var next = (this.href.indexOf('?') == -1) ? '?next=' : '&next=';
            this.href = this.href + next + window.location.pathname;
        });
    }
});
App.IdeaLabErrorView = Backbone.View.extend({
    template: "idealab-error-template",
    events: {
        "click .add-another": function () { this.parentView.unshowSide(); }
    }
});
App.IdeaLabIdeaDoneView = Backbone.View.extend({
    template: "idealab-idea-done-template",
    events: {
        "click .add-another": function () { this.parentView.unshowSide(); }
    }
});
App.IdeaLabImprovementDoneView = Backbone.View.extend({
    template: "idealab-improvement-done-template",
    events: {
        "click .add-another": function () { this.parentView.unshowSide(); }
    }
});

// Site-wide views
App.HeaderView = Backbone.View.extend({
    template: "header",
    events: {
        //'click .bsol h1': function() { navTo(); },
        'click .icon-gallery': function() { navTo(); },
        'click .icon-lab': function() { navTo('idealab'); },
        'click .logout': logOut
    },
    initialize: function () {
        // App.currentUser is used by ensureLoggedIn and logOut
        App.currentUser = new App.User();
        this.listenTo(App.currentUser, 'change', this.render);
        App.currentUser.fetch();
    },
    afterRender: function () {
        var name = App.currentUser.get('name');
        $('.user-indicator .username').text(name);
        $('.user-indicator')[name ? 'removeClass' : 'addClass']('hidden');
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
