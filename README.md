#About
**jQuery timeInput** is a time picker plugin for jQuery based on the HTML5 spec. Just a simple dropdown with suggested times in 24h format. am/pm is not a valid time according to the HTML5 spec. Validates and corrects hours and minutes. Seconds is not implemented yet. Feel free to send me pull requests.

Inspired by the jQuery timePicker plugin:
* [Sam Collet](http://www.texotela.co.uk)
* [Anders Fajerson](http://perifer.se)

The syntax is as follows:

    <input type="time" name="myTime" class="time-mm-hh" />

    <script>
        $(expression).timeInput(); // use default or html5 attributes
        $(expression).timeInput({min: "6:00", max: "15:00", step: 900}); // 15 min intervals from 6:00 am to 3:00 pm
    </script>


## jQuery Compatibility

Works with jQuery 1.4.2 and newer. (uses delegate)

Should work with:
 * IE 6/7/8
 * FF
 * Opera
 * Safari
 * Chrome

## Notes

IE won't let you use the selector input[type=time]. So use a class or similar instead.

Opera doesn't allow you to prevent the default action for keyboard events, so it's not possible to do custom handling of the arrow keys. This causes the direction to be opposite in Opera than in other browsers.
