/**
 * Represents a single block of text on a slide.
 */
var TextBox = new Class({
    Implements: [Options, Events],

    options: {
        width: 'auto',
        height: 'auto',
        x: 0,
        y: 0,
        font: '',
        color: '#000',
        shadow: '',
        text: ''
    },

    initialize: function(options) {
        this.setOptions(options);
        this.width = this.options.width;
        this.height = this.options.height;
        this.x = this.options.x;
        this.y = this.options.y;
        this.font = this.options.font;
        this.color = this.options.color;
        this.shadow = this.options.shadow;
        this.text = this.options.text;
        this.elem = null;
        this.index = -1;
    },

    create: function(index) {
        this.index = index;

        this.elem = Element('div', {
            'class': 'textbox',
            text: this.text
        });

        this.elem.setStyles({
            position: 'relative',
            left: this.x,
            top: this.y,
            width: this.width,
            height: this.height,
            font: this.font,
            color: this.color,
            'text-shadow': this.shadow
        });

        return this.elem;
    }
});

/**
 * Represents a single slide in the deck.
 */
var Slide = new Class({
    Implements: [Options, Events],

    options: {
        background: '',
        timing: 'click',
        textboxes: Array.from([])
    },

    initialize: function(options) {
        this.setOptions(options);
        this.background = this.options.background;
        this.textboxes = this.options.textboxes;
        this.timing = this.options.timing;
        this.elem = null;
        this.index = -1;
    },

    create: function(index) {
        this.index = index;

        this.elem = new Element('div', {
            id: 'slide-' + index,
            'class': 'slide',
        });
        this.elem.setStyles({
            position: 'relative',
            top: (-1 * index * Slide.HEIGHT) + 'px',
            left: (index * Slide.WIDTH) + 'px',
            width: Slide.WIDTH + 'px',
            height: Slide.HEIGHT + 'px'
        });
        if (this.background) {
            if (this.background.charAt(0) == '#') {
                this.elem.setStyle('background', this.background);
            } else {
                this.elem.setStyle('background',
                        'url(' + this.background + ') top left no-repeat');
            }
        }

        this.textboxes.each((function(textbox, index) {
            this.elem.adopt(textbox.create(index));
        }).bind(this));
        
        return this.elem;
    }
});

/**
 * Represents an entire deck of slides. Controls moving between them.
 */
var Deck = new Class({
    Implements: [Options, Events],

    options: {
        // empty
    },

    initialize: function(options) {
        this.setOptions(options);
        this.slides = Array.from([]);
        this.elem = null;

        var requested = location.search.match(/slide=(\d+)/i);
        if (requested) {
            this.current = parseInt(requested[1]);
        } else {
            this.current = 0;
        }
    },

    create: function(json) {
        Slide.WIDTH = json.width;
        Slide.HEIGHT = json.height;

        this.elem = new Element('div', {
            id: 'deck'
        });
        this.elem.setStyles({
            left: (-1 * Slide.WIDTH * this.current) + 'px'
        });

        json.slides.each((function(slide, sl_index) {
            var textboxes = Array.from([]);
            slide.textboxes.each((function(textbox, tb_index) {
                this.push(new TextBox(textbox));
            }).bind(textboxes));
            slide.textboxes = textboxes; 
            this.slides.push(new Slide(slide));
        }).bind(this));

        this.slides.each((function(slide, index) {
            this.elem.adopt(slide.create(index));
        }).bind(this));
        this.hookUpTiming();

        return this.elem;
    },

    next: function() {
        this.current += 1;
        if (this.current > this.slides.length - 1) {
            this.current = this.slides.length - 1;
            return;
        }

        this.animateTransition();
        this.hookUpTiming();
    },

    prev: function() {
        this.current -= 1;
        if (this.current < 0) {
            this.current = 0;
            return;
        }

        this.animateTransition();
        this.hookUpTiming();
    },

    animateTransition: function() {
        var fx = new Fx.Morph(this.elem, {
            duration: 750,
            transition: Fx.Transitions.Expo.easeInOut
        });
        fx.start({
            left: (-1 * Slide.WIDTH * this.current) + 'px'
        });
    },

    hookUpTiming: function() {
        this.elem.removeEvents();

        var slide = this.slides[this.current];
        if (slide.timing == 'click') {
            this.elem.addEvent('click', (function(event) {
                this.next();
                var help = $('help');
                if (help) {
                    help.setStyle('display', 'none');
                }
            }).bind(this));
        } else {
            setTimeout((function() {
                this.next();
                var help = $('help');
                if (help) {
                    help.setStyle('display', 'none');
                }
            }).bind(this), slide.timing * 1000);
        }
    }
});

/**
 * The singleton slide deck.
 */
var deck = new Deck();

/**
 * Get the ball rolling! Fetch the slides, shove them into the slide deck,
 * and hook up events.
 */
window.addEvent('domready', function() {
    var request = new Request.JSON({
        url: 'ignite.json',
        onSuccess: function(json) {
            $('window').setStyles({
                width: json.width + 'px',
                height: json.height + 'px',
                'margin-left': (-1 * json.width / 2) + 'px'
            });
            $('window').adopt(deck.create(json));
        }
    }).get();
});
