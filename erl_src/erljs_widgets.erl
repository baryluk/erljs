-module(erljs_widgets).
-author('baryluk@smp.if.uj.edu.pl').

% Copyright 2008-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project

% Widgets:
%
% Accordion:
%   Options:
%      native height vs constant height
%      collapsable (all closed) or non-collapsable (at least one opened)
%      switch on click, on hover, or on inten-hover (hover for some small period)
%      dragable
%      which entry should be opened initially
%      automatic animation beetween entries (timeout dependant on the size, or not), ping-pong, or cyclic.
%      disable animation for longer period if user manually changed entry
%      customizable icon (or none), per entry for closed/opened?
%      fill vertical space vs fill horizontal space
%      possibility to remove entry using "x"
%      draging up/down entries
%      dynamically adding/removing/rearanging elements from script
%
% Tabs:
%   Options:
%      tabbar on top or bottom
%      collapsable (all closed) or non-collapsable (at least one opened)
%      similar, icons,
%      remember lastly opened tab
%      removable tab using "x"
%      animations on switching, automatic animations, unless user interacts with tabs
%      constant height (maximum) or optimal height
%
% Datepicker:
%      which date/month to select/show by default
%      internationalization (Sunday/Monday as first, format of date, name of week days)
%      possibility to easly restrict to some range of dates
%      possibility to easly restrict to some days of weeks
%      possibility to easly add single days exceptions
%          for example: 1-04-2010 - 5-09-2010, mon,tue,wed,thu, but not 29-05-2010.
%      possibility to mark each of this restrictions in own way (like outside of range or day of weeks it is invalid, but explicit exception shows as being already reserved)
%         this can be done by explicitly calling callback, for allowed range of dates,  which should returnd "valid", "invalid" + style + optional tooltip + optional title/description to be show below when browing datapicker
%      possibility to show many month at once (for example in 2x3 grid)
%      suffixs
%      simple expressions, like "3 days ago", "next monday".
%
% Autocomplete:
%      multiple values
%      callback function, which can implement:
%           list, dict, communication with process, communication with server, caching, xml/json/ajax.
%      groups (if possible show 3 completions from 4 first groups)
%      values can have: value, title, description, group.
%      accent folding (searching for 'Jo', will return 'John', and als 'Jörn', but searching for 'Jö' will just return "Jörn')
%
% Buttons:
%      normal 'click' button
%      radio button (one of few is active), and they create a group
%      checkbox/toggle button (many of few can be active at once), and they create a group
%      left/right icon
%      label (it can be optional)
%      disabled state (cannot be clicked, and is in gray color)
%      tooltip
%      split button (like left text + right icon downward)
%      groups should be possible to be made both horizontally and veritically.
%
% Toolbar:
%      to contain buttons and groups of buttons in nice fashion.
%
% Slider:
%      horizontal or vertical
%      with fill from left or not
%      range slider
%      snap to increment
%      have buttons on both or one side
%
% Progressbar:
%      animated or none
%      of known progress or unknown progress.
%      simple spinner.
%
% Things to be done:
%   dnd: elements whicha can be sorted on a list
%   dnd: elements can be moved beetween lists
%   dnd: elements can be 
%
%
% animations:
%       any timeing function
%       animation based on time, not frames
%       repeating (cycling, pingpong)
%       animation of many things, like opacity, height, width, colors, fonts size, position.
