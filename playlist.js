class Playlist {
    constructor(url, title)
    {
        var temp = new Song(url, title, null);
        this.head = temp
        this.last = temp
    }

    add(url, title)
    {
        var node = new Song(url, title, null);
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
    constructor(url, title, next) 
    {
        this.url = url;
        this.next = next;
        this.title = title;
    }
}

const playlistMap = new Map();

module.exports.Playlist = Playlist;
module.exports.playlistMap = playlistMap;





