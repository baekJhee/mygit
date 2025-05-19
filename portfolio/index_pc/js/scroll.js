$(function(){
    $(window).scroll(function(){
        var sct = $(window).scrollTop();
        if(sct>2800){
            $("div#bgBaner>div").addClass("on");
        }else{
            $("div#bgBaner>div").removeClass("on");
        }
    })
})