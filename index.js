const Discord = require("discord.js");
const {
    prefix,
    token,
} = require("./config.json");
const ytdl = require("ytdl-core");

const mBot = new Discord.Client();
const queue = new Map();

mBot.once("ready", () => {
    console.log("Dude ntaus nkauj!");
});

mBot.once("reconnecting", () => {
    console.log("tos me ntsis!");
});
mBot.once("disconnect", () => {
    console.log("pom yall dua lwm zaus!")
});

mBot.on("message", async message => {
    if (message.author.bot) { return; }
    if (!message.content.startsWith(prefix)) { return; }

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}p`)) {
        execute(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message, serverQueue);
        return;
    } else {
        message.channel.send("ntaus kom yog mas tsov tom")
    }
});


async function execute(message, serverQueue) {
    const args = message.content.split(" ");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        return message.channel.send(
            "nkag rau ib lub Voice Channel ua ntej koj ntaus ib zaj nkauj mas tsov tom!");
    };
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(
            "Tso cai rau kuv nkag los tos nkauj, ntsej muag!"
        );
    }
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    }
    if (!serverQueue) {
        //Contract for queue
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
        };
        queue.set(message.guild.id, queueContruct);
        queueContruct.songs.push(song);
        try {
            // join voicechat and save our ocnnection
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            //call play function to start song
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }


    else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        return message.channel.send(`${song.title} gets ntsaws rau Queue`);
    }
}
function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        setTimeout(function () {
            serverQueue.voiceChannel.leave()
        }, 10000);
        queue.delete(guild.id);
        return;
    }
    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("tiav", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));

    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`pib tso nkuaj os: **${song.title}**`);
}


function skip(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send(
            "ntsej muag koj yuav tsum nkag voice channel to cancel nkauj na ua cas tsis paub li"
        );
    }
    if (!serverQueue) {
        return message.channel.send("tsis muaj nkauj rau kuv hla");
    }
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send(
            "nkag voice channel tua nkauj"
        );
    }
    if (!serverQueue) {
        return message.channel.send("tsis muaj nkauj rau kuv tua");
    }
}

mBot.login(token);