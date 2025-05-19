$(function(){
    var top = $("#topBtn");
    top.fadeOut(0);
    $(window).scroll(function(){
        var sct = $(window).scrollTop();
        if(sct>100){
            top.fadeIn("slow");
        }else{
            top.fadeOut(0)
        }
    })
    top.click(function(){
        $("html , body").animate({
            scrollTop:0
        },600)
        return false;
    })
})