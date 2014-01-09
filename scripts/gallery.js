
var gallery = new Gallery();

function Gallery()
{
}

Gallery.prototype.init = function(settings)
{
    this.settings = settings;
    this.surface = document.getElementById('surface');
    this.albums_button = document.getElementById('albums');
    this.gallery_title = document.getElementById('gallery_title');
    this.prev_nav = document.getElementById('prev_nav');
    this.next_nav = document.getElementById('next_nav');

    this.detectWindowDimensions();

    this.prev_nav.style.top = this.settings.nav_bar_height + 'px';
    this.next_nav.style.top = this.settings.nav_bar_height + 'px';
    this.prev_nav.style.height = this.window_height + 'px';
    this.next_nav.style.height = this.window_height + 'px';

    this.albums = [];

    var album_seq_num = 0;
    for (var album_name in this.settings.albums)
    {
        var album = new Album(album_seq_num, album_name, this.settings.albums[album_name]);
        this.albums.push(album);
        album_seq_num++;
    }

    var that = this;

    this.albums_button.addEventListener('click', function()
    {
        that.albumsClicked.call(that);
        return false;
    }, true);

    window.addEventListener('resize', function()
    {
        that.resized.call(that);
    }, true);
}

Gallery.prototype.addAlbum = function(name, picture_srcs)
{
    this.showAlbums();

    var last_album = this.albums[this.albums.length-1];
    var sequence_num = last_album.sequence_num + 1;

    this.albums.push(new Album(sequence_num, name, picture_srcs));
}

Gallery.prototype.detectWindowDimensions = function()
{
    this.window_width = this.getWindowSize('Width');
    this.window_height = this.getWindowSize('Height') - gallery.settings.nav_bar_height;
}

Gallery.prototype.getWindowSize = function(dimension)
{
    return Math.max(
        document.documentElement['client' + dimension],
        document.body['offset' + dimension], document.documentElement['offset' + dimension]
    );
}

Gallery.prototype.redraw = function()
{
    this.detectWindowDimensions();
    for (var i = 0; i < this.albums.length; i++)
    {
        this.albums[i].redraw();
    }
}

Gallery.prototype.showAlbums = function()
{
    for (var i = 0; i < this.albums.length; i++)
    {
        this.albums[i].close(false);
    }

    this.setTitle();
}

Gallery.prototype.setTitle = function(title)
{
    if (typeof title == 'undefined')
        title = 'Albums';

    this.gallery_title.innerHTML = title;
}

Gallery.prototype.getNumOfCols = function()
{
    var width_with_padding = gallery.settings.thumbnail_size + 2 * gallery.settings.thumbnail_padding;
    return Math.floor(this.window_width / width_with_padding);
}

Gallery.prototype.hideAlbums = function()
{
    for (var i = 0; i < this.albums.length; i++)
    {
        this.albums[i].hide();
    }
}

Gallery.prototype.showPrevNav = function(callback_this, callback)
{
    this.prev_nav.setAttribute('class', 'active_nav');

    // We want to override the click event on purpose
    this.prev_nav.onclick = function()
    {
        callback.call(callback_this);
    }
}

Gallery.prototype.showNextNav = function(callback_this, callback)
{
    this.next_nav.setAttribute('class', 'active_nav');

    // We want to override the click event on purpose
    this.next_nav.onclick = function()
    {
        callback.call(callback_this);
    }
}

Gallery.prototype.hideNav = function(callback_this, callback)
{
    this.prev_nav.setAttribute('class', 'inactive_nav');
    this.next_nav.setAttribute('class', 'inactive_nav');
}

Gallery.prototype.albumsClicked = function()
{
    this.showAlbums();
}

Gallery.prototype.resized = function()
{
    this.redraw();
}


window.addEventListener('load', function()
{
    document.getElementById('files').addEventListener('change', function(ev)
    {
        var files = ev.target.files;
        var picture_srcs = [];
        var num_of_pictures = 0;

        for (var i = 0; i < files.length; i++)
        {
            var file = files[i];

            if (!file.type.match('image.*'))
                continue;

            var reader = new FileReader();
            num_of_pictures++;

            reader.onload = (function(curr_file)
            {
                return function(e)
                {
                    picture_srcs.push(e.target.result);

                    // If all of the uploaded pictures are ready, create a new album from them
                    if (num_of_pictures == picture_srcs.length)
                        gallery.addAlbum('Local', picture_srcs);
                };
            })(file);

            reader.readAsDataURL(file);
        }
    }, false);
}, true);



function Album(sequence_num, name, picture_srcs)
{
    this.sequence_num = sequence_num;
    this.name = name;

    this.opened = false;
    this.visible = true;

    this.calculatePosition();

    this.pictures = [];
    for (var i = 0; i < picture_srcs.length; i++)
    {
        var last = (i == picture_srcs.length - 1);
        var picture = new Picture(this, i, picture_srcs[i], last);
        this.pictures.push(picture);
    }
}

Album.prototype.calculatePosition = function()
{
    var num_of_cols = gallery.getNumOfCols();
    var size_with_padding = gallery.settings.thumbnail_size + 2 * gallery.settings.thumbnail_padding;

    this.x = this.sequence_num % num_of_cols * size_with_padding;
    this.y = Math.floor(this.sequence_num / num_of_cols) * size_with_padding;
}

Album.prototype.redraw = function()
{
    this.calculatePosition();

    for (var i = 0; i < this.pictures.length; i++)
    {
        this.pictures[i].redraw();
    }
}

Album.prototype.close = function(animating)
{
    this.opened = false;
    this.visible = true;

    for (var i = 0; i < this.pictures.length; i++)
    {
        var pic = this.pictures[i];
        pic.close(animating);
    }

    gallery.setTitle();
}

Album.prototype.open = function(animating)
{
    this.opened = true;
    this.visible = true;

    for (var i = 0; i < this.pictures.length; i++)
    {
        var pic = this.pictures[i];
        pic.open(animating);
    }

    gallery.setTitle(this.name);
}

Album.prototype.getPicture = function(sequence_num)
{
    for (var i = 0; i < this.pictures.length; i++)
    {
        if (this.pictures[i].sequence_num == sequence_num)
        {
            return this.pictures[i];
        }
    }

    return null;
}

Album.prototype.hide = function()
{
    this.visible = false;
    this.redraw();
}

Album.prototype.show = function()
{
    this.visible = false;
    this.redraw();
}

Album.prototype.clicked = function()
{
    gallery.hideAlbums();

    this.open(true);
}


function Picture(album, sequence_num, src, last)
{
    this.album = album;
    this.sequence_num = sequence_num;
    this.src = src;
    this.last = last;

    this.enlarged = false;

    this.img = new Image();
    this.img.parent = this;

    this.img.onload = function()
    {
        this.parent.width  = this.width;
        this.parent.height = this.height;
        this.parent.loaded.call(this.parent);
    }

    this.img.src = this.src;
    document.getElementById('invisible').appendChild(this.img);
}

Picture.prototype.loaded = function()
{
    this.addClass('picture');

    this.orig_width = this.width;
    this.orig_height = this.height;

    this.calculatePosition();
    this.close();

    gallery.surface.appendChild(this.img);

    var that = this;
    this.img.addEventListener('click', function()
    {
        that.clicked.call(that);
    }, true);
}

Picture.prototype.redraw = function()
{
    this.calculatePosition();

    if (this.album.visible)
    {
        if (this.album.opened)
            this.open(true);
        else
            this.close(true);
    }
    else
    {
        if (this.enlarged)
            this.enlarge(true);
        else
            this.hide();
    }
}

Picture.prototype.calculatePosition = function()
{
    var ratio = Math.min(
        gallery.settings.thumbnail_size / this.orig_width,
        gallery.settings.thumbnail_size / this.orig_height
    );

    this.thumb_width = ratio * this.orig_width;
    this.thumb_height = ratio * this.orig_height;

    var num_of_cols = gallery.getNumOfCols();
    var size_with_padding = gallery.settings.thumbnail_size + 2 * gallery.settings.thumbnail_padding;

    var col = this.sequence_num % num_of_cols;
    var row = Math.floor(this.sequence_num / num_of_cols);

    this.offset_x = (gallery.settings.thumbnail_size - this.thumb_width) / 2;
    this.offset_y = (gallery.settings.thumbnail_size - this.thumb_height) / 2;

    this.thumb_x = col * size_with_padding + this.offset_x;
    this.thumb_y = row * size_with_padding + this.offset_y;
}

Picture.prototype.applyChanges = function(animating)
{
    if (animating)
        this.addClass('animating');
    else
        this.removeClass('animating');

    this.img.style.left   = Math.floor(this.x) + 'px';
    this.img.style.top    = Math.floor(this.y) + 'px';
    this.img.style.width  = Math.floor(this.width) + 'px';
    this.img.style.height = Math.floor(this.height) + 'px';
}

Picture.prototype.enlarge = function(animating)
{
    this.enlarged = true;

    var scale = Math.min(
        gallery.window_width / this.orig_width,
        gallery.window_height / this.orig_height
    );

    this.width = scale * this.orig_width;
    this.height = scale * this.orig_height;
    this.x = (gallery.window_width - this.width) / 2;
    this.y = (gallery.window_height - this.height) / 2;

    this.removeClass('hidden');
    this.addClass('enlarged');
    this.removeClass('rotate_left');
    this.removeClass('rotate_right');

    this.applyChanges(animating);
    this.showNav();
}

Picture.prototype.reduce = function(animating)
{
    this.enlarged = false;

    this.width = this.thumb_width;
    this.height = this.thumb_height;
    this.x = this.thumb_x;
    this.y = this.thumb_y;

    this.removeClass('enlarged');
    this.removeClass('rotate_left');
    this.removeClass('rotate_right');

    this.applyChanges(animating);
    this.hideNav();
}

Picture.prototype.open = function(animating)
{
    this.x = this.thumb_x;
    this.y = this.thumb_y;

    this.removeClass('hidden');
    this.removeClass('rotate_left');
    this.removeClass('rotate_right');
    this.addClass('opened');

    this.applyChanges(animating);
}

Picture.prototype.close = function()
{
    this.enlarged = false;

    this.hideNav();

    if (this.last)
    {
        var additional_class = this.album.sequence_num % 2 ? 'rotate_left' : 'rotate_right';
        this.addClass(additional_class);
    }

    this.removeClass('hidden');
    this.removeClass('opened');

    this.removeClass('enlarged');

    this.x = this.album.x + this.offset_x;
    this.y = this.album.y + this.offset_y;
    this.width  = this.thumb_width;
    this.height = this.thumb_height;

    this.applyChanges(true);
}

Picture.prototype.hide = function()
{
    this.addClass('hidden');
}

Picture.prototype.show = function()
{
    this.removeClass('hidden');
}

Picture.prototype.showNav = function()
{
    if (this.sequence_num > 0)
    {
        gallery.showPrevNav(this, this.prev);
    }

    if (!this.last)
    {
        gallery.showNextNav(this, this.next);
    }
}

Picture.prototype.prev = function()
{
    this.reduce(false);
    this.hide();
    this.hideNav();

    var prev_pic = this.album.getPicture(this.sequence_num - 1);
    prev_pic.enlarge(false);
}

Picture.prototype.next = function()
{
    this.reduce(false);
    this.hide();
    this.hideNav();

    var next_pic = this.album.getPicture(this.sequence_num + 1);
    next_pic.enlarge(false);
}

Picture.prototype.hideNav = function()
{
    gallery.hideNav();
}

Picture.prototype.hasClass = function(class_name)
{
    var classes = String(this.img.getAttribute('class'));
    return (classes.indexOf(class_name) != -1);
}

Picture.prototype.addClass = function(class_name)
{
    if (!this.hasClass(class_name))
    {
        var classes = this.img.getAttribute('class');
        var classes_str = (classes === null) ? '' : String(classes);

        this.img.setAttribute('class', classes_str + ' ' + class_name);
    }
}

Picture.prototype.removeClass = function(class_name)
{
    var classes = String(this.img.getAttribute('class'));
    classes = classes.replace(class_name, '');
    this.img.setAttribute('class', classes);
}

Picture.prototype.clicked = function(x, y)
{
    if (this.album.opened)
    {
        if (this.enlarged)
        {
            this.album.open(false);
            this.reduce(true);
        }
        else
        {
            this.album.hide();
            this.enlarge(true);
        }
    }
    else
    {
        this.album.clicked();
    }
}


$(function() {  

    yourip = '';

    $.getJSON("http://jsonip.com?callback=?", function (data) {
        yourip = data.ip;

        if ($.cookie('ipaddress') == yourip) {  
            close();
        } else {
            post_show();
        }
        $.cookie('ipaddress', yourip);
    });

    $(".close").click(function() {
        close();
    });

    setTimeout(function() {
        close();
    }, 7000);

});

function close() {  
    $(".note").hide();
    $(".screen-block").hide();
}

function post_show() {  
    $(".note").show();
    $(".screen-block").show();
}


