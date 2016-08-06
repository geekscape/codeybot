let CodeyBot = require("../lib/codeybot");

function random_int(maximum) {
  return(Math.round(Math.random() * maximum));
}

let cb = new CodeyBot({ hostname: "ajbot.local"});

//cb.command.face("0000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000001101000000000000001111110000000000000111111011001110100011111111111111110111111111111111111111111111111111111111111111111111111111111111111111111111111");

cb.on("ready", function() {
    console.log("ready, let's change wheels");
    setInterval(() => {
        cb.command.wheel_color(random_int(255), random_int(255), random_int(255));
    }, 1000);

    setInterval(() => {
        cb.status();
    }, 2000);
});


