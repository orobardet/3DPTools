'use strict';

module.exports = function (app) {
    const marked = require('marked');

    app.use((req, res, next) => {
        res.locals.changelogFormatter = text => {

            text = text.replace(/^#/umg, '##');
            text = text.replace(/^(\s*-\s*)\[(New|Imp|Fix|Tec)\]/umg, (match, p1, p2) => {
                return p1+'<span class="changelog-type"><span class="changelog-type-'+p2.toLowerCase()+'">'+p2.toUpperCase()+'</span></span>';
            });

            text = text.replace(/#(\d+)/ug, "[#$1]($1)");

            const issueRootURL = app.config.get('sourceCode:changelog:issueRootURL');
            const renderer = new marked.Renderer();
            renderer.link = (href, title, text) => {
                if (text.match(/#\d+/ug)) {
                    return '<a href="' + issueRootURL + href + '" target="_blank">' + text + '</a>';
                } else {
                    return '<a href="' + href + '" target="_blank">' + text + '</a>';
                }
            };

            return marked(text, { renderer: renderer });
        };
        next();
    });
};