class Playlist {
    constructor(url, title, thumbnail)
    {
        var temp = new Song(url, title, thumbnail, null);
        this.head = temp
        this.last = temp
    }

    add(url, title, thumbnail)
    {
        var node = new Song(url, title, thumbnail, null);
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
            return null;
        }
        else if(this.head == this.last)
        {
            var temp = this.head;
            this.head = null;
            this.last = null;
            return temp;
        }
        else
        {
            var current = this.head;
            this.head = this.head.next;
            return current;
        }
    }

    clear()
    {
        this.head = null;
        this.last = null;
    }
}

class Song {
    constructor(url, title, thumbnail, next) 
    {
        this.url = url;
        this.next = next;
        this.title = title;
        this.thumbnail = thumbnail;
    }
}

const playlistMap = new Map();

module.exports.Playlist = Playlist;
module.exports.playlistMap = playlistMap;





