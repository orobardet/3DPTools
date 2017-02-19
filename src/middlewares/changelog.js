module.exports = function (app) {
    var marked = require('marked');

    app.use(function (req, res, next) {
        res.locals.changelogFormatter = function(text) {

            text = text.replace(/^#/umg, '##');
            text = text.replace(/^(\s*-\s*)\[(New|Imp|Fix|Tec)\]/umg, function(match, p1, p2) {
                return p1+'<span class="changelog-type"><span class="changelog-type-'+p2.toLowerCase()+'">'+p2.toUpperCase()+'</span></span>';
            });

            text = text.replace(/#(\d+)/ug, "[#$1]($1)");

            var issueRootURL = app.config.get('sourceCode:changelog:issueRootURL');
            var renderer = new marked.Renderer();
            renderer.link = function(href, title, text) {
                return '<a href="'+issueRootURL+href+'" target="_blank">'+text+'</a>';
            };

            return marked(text, { renderer: renderer });
        };
        next();
    });
};