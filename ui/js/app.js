/* App JS */
// Libraries concatenated & compressed by by jekyll-assets pipeline
//
// First the scaffolding
//= require jquery.js
//= require modernizr.js
//= require bootstrap.js
//= require underscore.js
//= require isotope.pkgd.js
//= require showdown.js
//= require jquery.lazyload.min.js
//= require jquery.rwdImageMaps.min.js

// Then the templates

// Then the app
//= require backbone-app.js

$(function() {
    // Initialize a Showdown converter
    App.showdown = new Showdown.converter();
    // Initialize the Backbone router.
    App.router = new App.Router();
    // TODO change to PushState
    Backbone.history.start();
});
