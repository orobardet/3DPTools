$(function () {
    function modalHCenterReposition() {
        var modal = $(this),
            dialog = modal.find('.modal-dialog');
        modal.css('display', 'block');

        dialog.css("margin-top", Math.max(0, ($(window).height() - dialog.height()) / 2));
    }
    $('.modal.modal-h-center').on('show.bs.modal', modalHCenterReposition);
    $(window).on('resize', function() {
        $('.modal:visible').each(modalHCenterReposition);
    });
});