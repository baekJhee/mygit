$(function(){
    var num= 0;
    function opaAni(count){
        $("#event div:first-child+div li, #event>div:last-child a").removeClass("on");
        $("#event div:first-child+div li:eq("+count+"),#event>div:last-child a:eq("+count+")").addClass("on");
    }
    var autoAni = setInterval(function(){
        if(num<$("#event div:first-child+div li").length-1) num++; else num = 0;
        opaAni(num)
    },4000)
    $("#event>div:last-child a").click(function(){
        clearInterval(autoAni);
        num = $(this).index();
        opaAni(num);
        autoAni = setInterval(function(){
            if(num<$("#event div:first-child+div li").length-1)num++; else num = 0;
            opaAni(num)
        },4000)
    })
})