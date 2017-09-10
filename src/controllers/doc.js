'use strict';

const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const entities = new (require('html-entities').AllHtmlEntities)();

module.exports = function (app) {
    this.extractUrlParams = async (req, res, next) => {
        try {
            const config = app.get('config');
            const docRoot = config.get('doc:root') || '';

            // If the documentation root does not exist, don't try to show documentation
            if (!await fs.exists(docRoot)) {
                return res.redirect('/');
            }

            let pagePath = config.get('doc:defaultPage');
            // If we received no page name to display, use default page
            if (req.params['0'] && req.params['0'] !== '') {
                pagePath = req.params[0];
                delete req.params['0'];
            }

            // The page to display is a path, split it in path segment to process it
            let pagePathSegments = pagePath.split('/');
            // If there is no segment, it means no requested to display, so use default page
            if (!pagePathSegments.length) {
                pagePath = config.get('doc:defaultPage');
                pagePathSegments = pagePath.split('/');
            }

            // Store the requested page parameters, the rest of the function will compute the real filesyetem path
            // to the documentation file
            req.params.requestedPage = path.join(...pagePathSegments);

            const currentLang = req.getLocale();
            const defaultLang = config.get('doc:defaultLang');

            // Let's try the current locale first
            pagePathSegments.unshift(currentLang);
            if (!await fs.exists(path.join(docRoot, ...pagePathSegments))) {
                // Test the default locale
                pagePathSegments[0] = defaultLang;
                if (!await fs.exists(path.join(docRoot, ...pagePathSegments))) {
                    // No file found, redirect to the documentation homepage
                    return res.redirect('/doc');
                }
            }

            // Check if this is a directory
            let stats = await fs.stat(path.join(docRoot, ...pagePathSegments));
            if (stats.isDirectory()) {
                // We can't show a directory, but we can try if it contains a default page. If so, use it
                pagePathSegments.push(config.get('doc:defaultPage'));
                if (!await fs.exists(path.join(docRoot, ...pagePathSegments))) {
                    // Test the default locale
                    pagePathSegments[0] = defaultLang;
                    if (!await fs.exists(path.join(docRoot, ...pagePathSegments))) {
                        // No file found, redirect to the documentation homepage
                        return res.redirect('/doc');
                    }
                }
            }

            // If we are here, it means a valid documentation file path as been found, add id to the
            // request params for the next middleware
            req.params.pagePath = path.join(docRoot, ...pagePathSegments);

            return next();
        } catch (err) {
            return next(err);
        }
    };


    this._unflattenHeaders = (flatData) => {
        if (!flatData.length) {
            return [];
        }

        let level = flatData[0].level || 1;

        let hdrPile = [];
        let hdrList = [];
        for (let header of flatData) {
            if (header.level > level) {
                if (hdrList.length) {
                    hdrPile.push(hdrList);
                }
                hdrList = [];
                level = header.level;
                hdrList.push({
                    text: header.text,
                    anchor: header.anchor,
                    subHdr: []
                });
            } else if (header.level === level) {
                hdrList.push({
                    text: header.text,
                    anchor: header.anchor,
                    subHdr: []
                });
            } else if (header.level < level) {
                while (header.level < level) {
                    let previousHdr = hdrPile.pop();
                    previousHdr[previousHdr.length - 1].subHdr = hdrList;
                    hdrList = previousHdr;
                    level--;
                }
                hdrList.push({
                    text: header.text,
                    anchor: header.anchor,
                    subHdr: []
                });
            }
        }

        if (hdrPile.length) {
            let previousHdr = hdrPile.pop();
            previousHdr[previousHdr.length-1].subHdr = hdrList;
            hdrList = previousHdr;
        }

        return hdrList;
    };

    /**
     * Process a main ToC structure to reduce url and mark the item corresponding to the current url as 'active"
     *
     * Tailling '/' at the end of the current URL and ToC's url item are ignored
     *
     * The toc is an recursive object with the following structure (e.g.) :
     * {
     *   "home": {
     *     "link": "/doc/fr"
     *   },
     *   "filaments": {
     *     "link": "/doc/fr/filaments",
     *     "items": {
     *       "materials": {
     *         "link": "/doc/fr/materials"
     *       },
     *       "brands": {
     *         "link": "/doc/fr/brands"
     *       },
     *       "shops": {
     *         "link": "/doc/fr/shops"
     *       },
     *       "stats": {
     *         "link": "/doc/fr/filaments/statistics.md"
     *       }
     *     }
     *   },
     *   "install": {
     *     "link": "/doc/fr/install.md"
     *   },
     *   "config": {
     *     "link": "/doc/fr/configuration.md"
     *   },
     *   "admin": {
     *     "link": "/doc/fr/administration"
     *   }
     * }
     *
     * @param currentUrl string The current url
     * @param toc ToC structure
     */
    this.processTocList = (currentUrl, toc) => {
        let processedToc = {};
        let hasActiveItem = false;
        currentUrl = currentUrl.replace(/\/$/, '');

        for (let [idx, item] of Object.entries(toc)) {
            let subActiveItem = false;
            item = Object.assign({}, item);
            if (item.items && Object.keys(item.items).length) {
                [item.items, subActiveItem] = this.processTocList(currentUrl, item.items);
            }

            if (item.link) {
                item.link = item.link.replace(/\/$/, '');
                if (subActiveItem || item.link === currentUrl) {
                    hasActiveItem = true;
                    item.active = true;
                }
            }

            processedToc[idx] = item;
        }

        return [processedToc, hasActiveItem];
    };

    /**
     * Get the content of the markdown main documentation's TOC file
     *
     * First search for the TOC file in the current language. If it does not exists, fallback to the default language
     * TOC file, if any.
     */
    this.getToc = (currentUrl, config) => {
        let [toc, hasActiveItem] = this.processTocList(currentUrl,  config.get('doc:navigation:TOC') || {});
        return toc;
    };

    /**
     * List of all shops
     */
    this.showDocPage = async (req, res, next) => {
        try {
            const config = app.get('config');
            const docRoot = config.get('doc:root') || '';

            const docFile = req.params.pagePath;
            const docContent = (await fs.readFile(docFile)).toString();

            // Render page
            const renderer = new marked.Renderer();
            let headers = [];
            renderer.link = (href, title, text) => {
                if (href.match(/^[^/]+:\/\//i)) {
                    return `<a href="${href}" class="external" target="_blank">${text}</a>`;
                } else if (href.match(/^\/?doc/i)) {
                    let localHref = href.replace(/\/?(doc)\/[^/]+\/?(.*)$/i, '/$1/$2');
                    return `<a href="${localHref}" class="doc">${text}</a>`;
                } else if (href.match(/^\/?src/i)) {
                    return `<span class="removed-link" title="${href}">${text}</span>`;
                } else if (href.match(/^[^/]/i)) {
                    return `<a href="/${docRoot}/${href}" class="doc">${text}</a>`;
                } else {
                    return `<a href="${href}" class="internal">${text}</a>`;
                }
            };
            renderer.image = (href, title, text) => {
                let titleAttr = '';
                if (title) {
                    titleAttr = ` title="${title}"`;
                }
                if (href.match(/^[^/]+:\/\//i)) {
                    return `<p><img src="${href}" class="external" alt="${text}"${titleAttr}/></p>`;
                } else if (href.match(/^\/?doc/i)) {
                    let localHref = href.replace(/\/?(doc)\/([^/]+\/?.*)$/i, '/$1-statics/$2');
                    return `<p><img src="${localHref}" class="doc" alt="${text}"${titleAttr}/></p>`;;
                } else if (href.match(/^\/?src/i)) {
                    return `<span class="removed-img"${titleAttr}>${text}</span>`;
                } else if (href.match(/^[^/]/i)) {
                    return `<p><img src="/doc-statics/${href}" class="doc" alt="${text}"${titleAttr}/></p>`;
                } else {
                    return `<p><img src="${href}" class="internal" alt="${text}"${titleAttr}/></p>`;
                }
            };
            renderer.heading = (text, level) => {
                let decodedText = entities.decode(text);
                let anchorName = decodedText.toLowerCase().replace(/[^\w]+/g, '-');

                headers.push({
                    level: level,
                    text: decodedText,
                    anchor: anchorName
                });

                return `<h${level}><a href="#${anchorName}" name="${anchorName}" id="${anchorName}" class="anchor-link"><i class="fa fa-link"></i></a><span class="header-link"></span>${text}</h${level}>`;
            };

            const renderedDocContent = marked(docContent, { renderer: renderer });
            const headersNavigation = this._unflattenHeaders(headers);

            return res.render('doc', {
                pageTitle: 'Documentation',
                toc: this.getToc(req.originalUrl, app.get('config')),
                docPagePath: docFile,
                docPageContent: renderedDocContent,
                headersNavigation: headersNavigation,
                headersNavigationLevelMax: config.get('doc:navigation:headersLevelMax') || 5
            });
        } catch (err) {
            return next(err);
        }
    };

    return this;
};