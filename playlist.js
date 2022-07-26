class Playlist {
    constructor(url, title, thumbnail, artist, source, duration)
    {
        var temp = new Song(url, title, thumbnail, artist, source, duration, null);
        this.head = temp
        this.last = temp
        this.playing = temp
    }

    add(url, title, thumbnail, artist, source, duration)
    {
        var node = new Song(url, title, thumbnail, artist, source, duration, null);
        if(this.head == null)
        {
            this.head = node;
            this.last = node;
        }
        else
        {
            var current = this.last;
            current.next = node;
            this.last = node;
        }
    }

    pop()
    {
        if(this.head == null)
        {
            this.playing = null;
            return null;
        }

        if(this.head == this.last)
        {
            var temp = this.head;
            this.head = null;
            this.last = null;
            this.playing = temp;
            return temp;
        }

        var current = this.head;
        this.head = this.head.next;
        this.playing = current;
        return current;
    }

    clear()
    {
        this.head = null;
        this.last = null;
    }
}

class Song {
    constructor(url, title, thumbnail, artist, source, duration, next) 
    {
        this.url = url;
        this.next = next;
        this.title = title;
        this.thumbnail = thumbnail;
        this.source = source;
        this.artist = artist;
        this.duration = duration;
    }
}

const playlistMap = new Map();

module.exports.Playlist = Playlist;
module.exports.playlistMap = playlistMap;





