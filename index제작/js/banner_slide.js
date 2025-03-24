$(function(){
    var num = 0;
    function opaAni(count){
        $("#moBaner li").removeClass("on");
        $("#moBaner li:eq("+count+")").addClass("on")
    }
    var autoAni = setInterval(function(){
        if(num<$("#moBaner li").length-1) num++; else num = 0;
        opaAni(num)
    },4000)

    var aniW = $(window).width();
    $("#imgWrap li").width(aniW);
    $("#imgWrap li").height(aniW/2.2);
    $("#imgWrap").css("margin-left",-aniW)
    
    var count = 0;
    function aniRoll(dir,aniW){
        var aniW = $(window).width();
        $("#imgWrap").stop(true,true).animate({
            "margin-left":dir*aniW+parseInt($("#imgWrap").css("margin-left"))
        },800,function(){
            if(dir==-1){
                $("#imgWrap li:first-child").appendTo($("#imgWrap"))
            }else{
                $("#imgWrap li:last-child").prependTo($("#imgWrap"))
            }
            $("#imgWrap").css("margin-left",-aniW);
        })
    }
    var rollAuto = setInterval(function(){
        aniRoll(-1);
        if(count<$("#dataList li").length-1)count++;else count = 0;
    },3000)
    
    $(window).resize(function(){
        clearInterval(rollAuto)
        aniW = $(window).width();
        $("#imgWrap li").width(aniW);
        $("#imgWrap li").height(aniW/2.2);
        $("#imgWrap").css("margin-left",-aniW);
        rollAuto = setInterval(function(){
            aniRoll(-1,aniW);
            if(count<$("#dataList li").length-1)count++;else count = 0;
        },3000)
    })
})