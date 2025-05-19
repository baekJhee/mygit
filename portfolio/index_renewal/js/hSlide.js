 $(function(){
     //수직슬라이드
     var $rolBox = $("#slide .pcSlide .rolBox");
     var aniH = $rolBox.find("li").height();
     var dir = -1;
        $rolBox.css("margin-top", -aniH);
        function roll(a){
         $(".rolBox").stop(true, true).animate({
             "marginTop":a*aniH+parseInt($(".rolBox").css("margin-top"))
         },700 , function(){
             if(a==-1){
                 $(">li:first-child",this).appendTo($(this))
             }else{
                 $(">li:last-child",this).prependTo($(this))
             }
             $(".rolBox").css("margin-top",-aniH);
         })            
     }
     var autoRoll = setInterval(function(){
         roll(-1);
     },3000)
     $("#slide .pcSlide .rolBox li").on("mouseenter",function(){
         clearInterval(autoRoll);
    }).on("mouseleave",function(){
         autoRoll = setInterval(function(){
             roll(-1);
         },3000)
     })
 })