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

    $('a.need-confirmation').click(function(e) {
        var $this = $(this);
        var message =  $this.data('confirm-message');
        var url =  $this.attr('href');

        if (!message || !url) {
            return true;
        }

        e.preventDefault();
        App3DPTools.confirmModal(message, function () {
            document.location = url;
        });
    });
});