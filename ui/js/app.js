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
//= require about
//= require header
//= require footer
//= require modules-list-template
//= require modules-list-item-template
//= require module-detail-template
//= require value-detail-template
//= require idealab-detail-template
//= require idealab-idea-template
//= require idealab-list-template
//= require idealab-template
//= require idealab-idea-template

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
