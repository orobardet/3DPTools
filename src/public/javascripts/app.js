var App3DPTools = {

    errorFlash: function (container, message) {
        return this.messageFlash(container, message, 'danger');
    },

    successFlash: function (container, message) {
        return this.messageFlash(container, message, 'success');
    },

    messageFlash: function (container, message, level) {
        var $container = $(container);

        if (!$container.length) {
            return;
        }

        $alertNode = $('<div>').addClass('alert').addClass('alert-' + level);
        $('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>').appendTo($alertNode);
        $alertNode.append(message);

        $container.append($alertNode);

        setTimeout(function () {
            $alertNode.remove();
        }, 2000);
    },

    confirmModal: function (message, cb) {
        var $modal = $('#3dptoolConfirmModal');
        if (!$modal.length) {
            $('body').append('<div id="3dptoolConfirmModal" class="modal confirm-modal" role="dialog" aria-labelledby="dataConfirmLabel" aria-hidden="true">'
                + '<div class="modal-dialog" role="document">'
                + '<div class="modal-content">'
                + '<div class="modal-header draggable">'
                + '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
                + '<h4 class="modal-title">' + Locale3DPTools.__('Confirm') + '</h4>'
                + '</div>'
                + '<div class="modal-body"></div>'
                + '<div class="modal-footer">'
                + '<fieldset>'
                + '<button type="button" class="btn btn-default" data-dismiss="modal">' + Locale3DPTools.__('No') + '</button>'
                + '<button type="button" class="btn btn-primary btn-validate-modal">' + Locale3DPTools.__('Yes') + '</button>'
                + '</fieldset>'
                + '</div>'
                + '</div>'
                + '</div>'
                + '</div>');

            $modal = $('#3dptoolConfirmModal');

            $('.btn-validate-modal', $modal).click(function () {
                $modal.modal('hide');
                cb.apply();
            });
        }

        $modal.find('.modal-body').text('');
        if (message instanceof jQuery) {
            $modal.find('.modal-body').append(message);
        } else {
            $modal.find('.modal-body').text(message);
        }
        $modal.modal('show');
    },

    colorStringParsers: [{
        re: /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*?\)/,
        format: 'rgb',
        parse: function (execResult) {
            return [
                execResult[1],
                execResult[2],
                execResult[3],
                1
            ];
        }
    }, {
        re: /rgb\(\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*?\)/,
        format: 'rgb',
        parse: function (execResult) {
            return [
                2.55 * execResult[1],
                2.55 * execResult[2],
                2.55 * execResult[3],
                1
            ];
        }
    }, {
        re: /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)/,
        format: 'rgba',
        parse: function (execResult) {
            return [
                execResult[1],
                execResult[2],
                execResult[3],
                execResult[4]
            ];
        }
    }, {
        re: /rgba\(\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)/,
        format: 'rgba',
        parse: function (execResult) {
            return [
                2.55 * execResult[1],
                2.55 * execResult[2],
                2.55 * execResult[3],
                execResult[4]
            ];
        }
    }, {
        re: /hsl\(\s*(\d*(?:\.\d+)?)\s*,\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*?\)/,
        format: 'hsl',
        parse: function (execResult) {
            return [
                execResult[1] / 360,
                execResult[2] / 100,
                execResult[3] / 100,
                execResult[4]
            ];
        }
    }, {
        re: /hsla\(\s*(\d*(?:\.\d+)?)\s*,\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)/,
        format: 'hsla',
        parse: function (execResult) {
            return [
                execResult[1] / 360,
                execResult[2] / 100,
                execResult[3] / 100,
                execResult[4]
            ];
        }
    }, {
        re: /#?([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
        format: 'hex',
        parse: function (execResult) {
            return [
                parseInt(execResult[1], 16),
                parseInt(execResult[2], 16),
                parseInt(execResult[3], 16),
                1
            ];
        }
    }, {
        re: /#?([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,
        format: 'hex',
        parse: function (execResult) {
            return [
                parseInt(execResult[1] + execResult[1], 16),
                parseInt(execResult[2] + execResult[2], 16),
                parseInt(execResult[3] + execResult[3], 16),
                1
            ];
        }
    }],

    colorParse: function (colorValue) {
        var that = this;
        var result = false;
        $.each(this.colorStringParsers, function (i, parser) {
            var match = parser.re.exec(colorValue);
            var values = match && parser.parse.apply(that, [match]);
            if (values) {
                match.format = parser.format;
                result = match;
                return false;
            }
        });

        return result;
    }
};

$(function () {
    function modalHCenterReposition() {
        var modal = $(this),
            dialog = modal.find('.modal-dialog');
        modal.css('display', 'block');

        dialog.css("margin-top", Math.max(0, ($(window).height() - dialog.height()) / 2));
    }

    $('.modal.modal-h-center').on('show.bs.modal', modalHCenterReposition);
    $(window).on('resize', function () {
        $('.modal:visible').each(modalHCenterReposition);
    });

    $('a.need-confirmation').click(function (e) {
        var $this = $(this);
        var message = $this.data('confirm-message');
        var url = $this.attr('href');

        if (!message || !url) {
            return true;
        }

        e.preventDefault();
        App3DPTools.confirmModal(message, function () {
            document.location = url;
        });
    });
});