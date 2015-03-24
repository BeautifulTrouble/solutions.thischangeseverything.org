/* App JS */
// Libraries concatenated & compressed by by jekyll-assets pipeline
//
// First the scaffolding
//= require jquery.js
//= require modernizr.js
//= require underscore.js
//= require bootstrap.js
//= require isotope.pkgd.js
//= require Showdown.js
//= require jquery.lazyload.js
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

    // Check for orientation change, adjust body class
    function orient() {  
        if (window.orientation === 0 || window.orientation === 180) {
            //$("body").addClass("class", "portrait");
            $("body").addClass("portrait");
            $("body").removeClass("landscape");
            orientation = 'portrait';
            return false;
        }
            else if (window.orientation === 90 || window.orientation === -90) {
            $("body").addClass("landscape");
            $("body").removeClass("portrait");
            orientation = 'landscape';
            return false;
        }
    }
    /* Call orientation function on page load */
    $(function(){
            orient();
    });
    /* Call orientation function on orientation change */
    $(window).bind( 'orientationchange', function(e){
            orient();
    });
});
