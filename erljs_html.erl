-module(erljs_html).

% See also:
%
%    Yaws - http://yaws.hyber.org/dynamic.yaws
%    IL2JS
%    XHTML.M from oscigen - http://ocsigen.org/docu/1.3.0/XHTML.M.html
% 


standards() ->
	[
		html4.01_transitional,
		html4.01_strict
		xhtml1.0,
		xhtml1.1,
		html5
	].

scheme_options() ->
	[
		allow_custom_a_href,
		allow_raw_dirty,
		disable_validation,
		{size_limit, 100000}
	].

example() ->
	{html, [
		{head, {title, "kuku"}},
		{body, [
			{hl, "Hello world"}
		]}
	]}.


% Syntax and examples:
%  ElementName
%      'hr', 'br'
%  {ElementName, Child} when is_string(Child); is_binary(Child); is_tuple(Child)
%      
%  {ElementName, Childs} when is_list(Childs)
%  {ElementName, Atributes, Child}
%  {ElementName, Atributes, Childs}

% ElementName can be:
%   html, head, meta, base, title, body, manifest (+HTML5)
%   bdo
%   section, header, menu, nav (all +HTML5)
%   h1, h2, h3, h4, h5, h6
%   p, div, span,
%   pre, pcdata
%   ruby, rb, rp, rt  (all +HTML5)
%   abbr, acronym (-HTML5), address, q, blockquote, del, ins, em, strong, mark (+HTML5)
%   b, i
%   table, caption, colgroup, col, thead, tfoot, tbody, tr, th, td
%   ul, ol, li
%   dl, dt, dd
%   a, area, img, map
%   figure, figcaption (all +HTML5)
%   form, label, legend, input, textarea, fieldset, datalist (+HTML5)
%   noscript, script
%   video, audio, canvas, meter, kbd (all +HTML5)
%   var
%
%   html_raw - use Childs direclty as content.
%    Still content will be tested to be valid xml chunk in this context.
%    Do not use things like  [{raw,"<pre>"},{raw, Bin},"{raw,</pre>"}],
%    better use like {raw,["<pre>",Bin,"</pre>"]}.
%    Child(s) of raw is an iolist, but can als contain ehtml, again
%    using {ehtml, ...}
%    It will not be encoded in any way.
%
%   {stream, Acc0, fun(Acc) -> {E, Acc} end}.
%     Similary, but fun will be evaluated just on sending data to the browser,
%     thus keeping memory requirment smaller.
%     Good for tables and lists of any kinds.
%     Remember that this is probably only usefull if backend data
%     is also retrivied in similar fashion (like cursor in qlc,
%     or iterators in mnesia, dets, or cursor in SQL).
%
%   ehtml - is silently ignored, but its child must be valid ehtml,
%           and is valideted. If there are attributes, they are inspected,
%           for example to change encoding, or perform scheme translations.
%
%   ehtml, [valid] - if it is ehtml chunk, but it is already valid.
%   html_raw, [valid] - similary but for validated html_raw chunks.
%
%   raw, [dirty] - if it is already compiled and verified.
%               Or you are sure it is valid for other reason.
%               Or want to cheat, and send invalid xml.
%               Or you tested that performance of validator is a bottlneck.
%
%   string, int, float - will type check content, and convert data
%                 to the proper form. String can be iolist,
%                 HTML safe encoding will be performed.
%                 (coding using entities and few others characters
%                  which can dangerous normally)
%
%   {include, File} - will include file with ehtml term, it can
%        contain many terms, each terminated with dot.
%   {include, [valid], File} - marks that content of File have been
%        already in some way valideted (i.e. in cache), or for performance reasons.
%   {include, [raw], File} - will include file just like raw, must be valid HTML/XML part.
%   {include, [raw,dirty], File} - will include file just
%        like raw, but will not be validated.
%   {include, [raw, {rewrite, "%", [{"A", "Godzilla"}]}], File} - also
%        available as {ssi, "filename.txt", "%", [{"a", "Godzilla"}]} -
%        includes file, but all occurence of "%a%" are changed into "Godzilla"
%        variable names should be have first letter upper case (just like Erlang variables)
%        and MUST not contain "%", or whitespaces. It should only use letters, numbers, underline.
%        Optionally it can contain: minus, plus, star, dot, double collon, collon, braces,
%        curly-braces, squre brackets, angle brackets, dollar, pipe, slash, semicolon,
%        exclamation mark, at-sign, hash-mark.
%   {include, [{rewrite, [{"A", "Godzilla"}]}], File} - works similary to {include, File}
%        but allows using variables. It is forbiden to use Erlang expressions other than term construction,
%        in included file.
%   {include, [dtl], {template_module, something, File}} - include File as DTL (Django template).
%        One can add 'dirty' option, if want to assume validity.
%        If one will use atom to reference module, then File will be compiled
%        once into template_module:something/1 function. If no such module exists
%        it will be created from given template and compiled properly on first usage.
%        Dynamic recompilation of new files (for example after change, but without restarting server and removing beam files),
%        can be done based on atime, or manually (globally or per-file or per-module)
%        using erljs_html:dtl_options([Opts]) where Opts is
%           clear_all  - will clear all files and recompile them, on next usaxe.
%           mtime - will set automatic recompilation based on modification time of file
%           every - will recompile template on every access (can be usefull when developing application,
%                     or when there are very big number of templates, as they will normally be loaded
%                     into VM as modules, thus consuming RAM).
%           recompile_known - will recompile all loaded currently templates.
%
%        DTL templates will use current request dictionaries as variables.
%        You can also provide own values using, {rewrite,[...]} just like in ehtml templates,
%        but you keys need to be valid Python identifiers (still they also should begin
%        from upper case, to/from make porting to ehtml templates and javascript easier).
%
%        DTL template can be compiled to raw text, or to ehtml templates, thus making,
%        validation and dynamic insertion into DOM easier (without innerHTML).
%
%        For compiled ehtml templates it is possible, to update live DOM tree, in such manner,
%        that if on new rendering in the same place some part of HTML will no change
%        they will not be removed from DOM tree, if some was removed/added (due to the  {% if %}),
%        they will be removed/added. In case of loops, the old childrens will be removed, and new
%        childrens will be added (this can be changed by {loops,append}, which will append new childs
%        after existing ones if they exist). This only applies to the outer-most loops.
%
%        For more on DTL go to:
%           http://www.djangoproject.com/documentation/templates/
%           http://archive.dojotoolkit.org/nightly/dojotoolkit/dojox/dtl/
%
%    In case of files, file will not be readed to the memory, but will be streamed to the client when nacassary.
%
%    In case of error (no such regular file, bad permissions) response will immiedietly stop,
%    and connection will be terminated unclearly. Be sure no error will occur.
%
%  When rewriting values, one can use string, binary-string, or {ehtml, ...} struct (it will be
%  serialized to html binary-string).
%
% Attributes needs to be valid attributes for corresponsing
% tag elements. Their values also need to be correct.
%
%   One can also create own tags:
%
%    new_element_type(page, fun (Attributes, Childs) when is_list(Childs) ->
%       {ehtml, {html, {
%            header,
%            {body, Childs}
%       }}}.
%    end, [parse_childs]).
%
%    new_element_type(header, fun (Attributes, Childs) when is_list(Childs) ->
%       {raw, "Hello"}
%    end, [parse_childs, cache]).
%
%    new_element_type(my_table, fun (Attributes, [{stream, SubAcc0, Fun}]) ->
%       {ehtml, {table,
%          {stream, {SubAcc0, 1}, fun({SubAcc, N) ->
%              Style = if
%                  N rem 2 == 1 -> [{class, 'odd'}];
%                  true -> [{class, 'even'}]
%              end,
%              {SubE, NewSubAcc} = Fun(SubAcc),
%              E = {tr, [Style], SubE},
%              NewAcc = {NewSubAcc, N+1},
%              {E, NewAcc}
%           end}
%       }}
%    end, [parse_childs, cache]).

%
%   If there was no Attributes or Childs, they will be an empty list.
%   In all cases it will be an list (also in case only one element
%   was given originally, or raw data, pcdata, or string, or binary).
%
%   parse_childs - means that ehtml engine will first parse
%                  all childrens before giving them to the fun.
%   no_parse_childs - means that fun must parse them alone.
%
%   cache - means that result of fun will be cached (as far as Attributes and Childs) match
%           generation and validation will be performed only once.
%
%
%   Fun should return ehtml (which could possibly trigger again some
%   funs to be called) or raw data.


% One can also use parse transform (similar to qlc:q([...]) ...) in the form:


% erljs_html:pf({ehtml, {html, {body,
%   [header,
%   ...
%   ]
% }}})
%
% such ehtml, will be parsed and compiled in advance to most compressed
% form with minimal space, network and cpu usage (for example
%  glueing together consecutive opening tags into single binary,
%  it will be flat narrow list, not deep and wide list).
% in case it is literal constant term, it is simple
% in case it refferes to some variables or functions or expressions,
%  it will try to compile as much as possible from it, and make original
%  call a call to the specialized fun).
%
% Care must be taken when generating huge amount data, as
% all data is keeped in memory. For huge amount of data,
% streaming techniques can be used.
%
%
% Hyperlinks should be encoded using
%   erljs_html:a(LogicalKey, [{param,Value}}, [OtherAttributes])
% where OtherAttributes can also contain {target,"xxx"}, which will translate into "#xxx" appened to href.
% Direct usage of 'a' can be disabled, or checked,
% by changing scheme (allow_custom_a_href). 
%
% 
% erljs_html:register_a(LogicalKey, RealPath,
%     [{param1,int,required},
%      {param2,float,optional},
%      {"param3",any,optional},
%      {{"^params_.*$"},int,optional}
% )
%
% This have many advantages.
%    - you can track usage of all links
%    - you can add additional parameters (like security tokens, session ids)
%    - you can easly move site or part of it to other directory, or location
%    - you can enforce absolute or relative URLS
%    - you can enforce https encryption
%    - you can create proxy/redir page, which will hide user's Refferer
%
%
%

%
% syntactic sugar for 'style' attribute
%


% TODO: registering parameters.
%
%
% ?get_required(int, Page).
% ?get_required(postive_int, Page).
% ?get_required(float, Temp).
% ?get_optional(identifier, Temp).
% ?get_optional(id, Id).
% ?get_optional(atom, Elem).   % it will must be 'atom' like, but not actually converted
% ?get_optional({"....-....-\\d\\d"}, Key). % for regular expressions
% ?get_optional(fun(X) -> is_valid_token(X) end, Token). % for general tests
% listing(Req) ->
%   {page,
%      ["something -", Page]
%   }.
%
% in case of int, positive_int, float - arguments are parsed as int or float.
%

% ?pre_require(secure).  % https over ssl/tls. todo: warn/clear cookies, log referrer, etc
% ?pre_require(auth).
% ?pre(log).
% ?post(trace).
% ?cookie(present).
% ?header(present, "Refferer").


%
% Other important parts in ehtml
%  {status, 404}             % yaws
%  {status, 404, "WTF"}
%  {redirect, URL}           % yaws % URL must be absolute URL
%  {redirect_local, Path}    % yaws % URL 
%  {headers, [
%       clear,
%       [{set, Header}]
%       [{replace, Header}]
%       [{append, Header}]
%       [{remove, Header}]
%  ]}.
%   where Header is binary or string "XXX: YYY", or {'XXX', "YYY"}
%    no new lines allowed.
%  ok                        % yaws % do nothing
%  {'EXIT', normal}          % yaws
%  {content, MimeType, Data} % yaws
%  {sendfile, FileName, Start, End}   % End can be eof.
%
%  %{allheaders, [Headers]}  % yaws
%  %{header, Header}  % yaws
%
%  {streamcontent, MimeType, FirstChunk}      % yaws
%
%     in other process.
%            % YawsPid is original process which was serving, so S=self(),spawn(fun()->loop(S) end)
%            yaws_api:stream_chunk_deliver(YawsPid, BinData),
%            yaws_api:stream_chunk_deliver(YawsPid, BinData),
%            yaws_api:stream_chunk_deliver_blocking(YawsPid, Data), % with sending flow-control
%            yaws_api:stream_chunk_end(YawsPid),
%            exit(normal).
%
%  NewPid = spawn(fun() -> loop(A#arg.clisock) end),
%  [{header, {content_length, Sz}},                       % without content_length, chunked mode (b) is used
%   {streamcontent_from_pid, MimeType, NewPid}] % yaws
%
%     in loop
%                                                         % {discard, YawsPid} ->
%                                                         %   yaws_api:stream_process_end(Sock, YawsPid);
%                                                         % {ok, YawsPid} ->
%                                                         %   a) yaws_api:stream_process_deliver(Socket, BinData),
%                                                         %   a) yaws_api:stream_process_deliver(Socket, BinData),
%                                                         %   b) yaws_api:stream_process_deliver_chunk(Socket, IoList),
%                                                         %   b) yaws_api:stream_process_deliver_chunk(Socket, IoList),
%                                                         %   b) yaws_api:stream_process_final_deliver_chunk(Socket, IoList),
%                                                         %   yaws_api:stream_process_end(Socket, YawsPid)
%                          for delive
%
% {ssi, FileName, Separator, [{"var","Rewriting it to something"}.  % yaws. similar to include.
%                                                                   % included for compatibility.
% {yssi, FileName}.   % yaws, only top level element from out/1.


% TODO:
%  SVG: esvg     % http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd
%    svg
%    a, altGlyph, altGlyphDef, altGlyphItem, animate, animateColor, animateMotion, animateTransofrm
%    circle, clipPath, color_profile, cursor
%    definition_src, defs, desc
%    ellipse
%    feBlend, feColorMatrix, feComponentTransfer, feComposite, feConvolveMatrix, feDiffuseLighting, feDisplacementMap, feFlood, feFuncA, feFuncB, feFuncG, feFuncR, feGaussianBlur, feImage, feMerge, feMergeNode, feMorphology, feOffset, fePointLight, feSpecularLighting, feSpotLight, feTile, feTurbulence
%    filter, font, font_face, font_face_format, font_face_name, font_face_src, font_face_uri, foreignObject
%    g, glyph, glyphRef
%    hkern, vkern
%    image
%    line, linearGradient
%    marker, mask, metadata, missing_glyph
%    mpath, path, pattern, polygon, polyline
%    radialGradient, rect
%    script, set, stop, style, switch, symbol
%    text, textPath, title, tref, tspan
%    use, view
%
%    esvg_valid - marks that esvg fragment should not be validated, as it was already validated
%    svg_raw - to put iolist() directly in given place. it still need to be valid svg fragment, and validate
%
%  Example:
%    {esvg, [{width,"100%"},{height,"100%"}], [
%         {circle, [{cx,100},{cy,50},{r,40},{stroke,'black'},{stroke_width,2},{fill,'red'}], []},
%         {rect, [{x,20},{y,20},{rx,20},{ry,20},{width,250},{height,250},{style,"fill:blue;stroke:ping;fill-opacity:0.1;stroke-opacity:0.9"}], []},
%         {ellipse, [{cx,300},{cy,150},{rx,200},{ry,80},{style,"fill:rgb(200,100,50)"}], []},
%         {line,[{x1,0},{y1,0},{x2,300},{y2,300},{style,"stroke:rgb(99,99,99);stroke-width:2"}], []},
%         {polygon,[{points,"220,100 300,210 170,250"},{style,"fill:#cccccc;stroke:#000000;stroke-width:1"}], []},
%         {polyline,[{points,"0,0 0,20 20,20 20,40 40,40 40,60"},{style,"fill:green;stroke:red;stroke-width:2"}], []},
%         {path, [{d,"M250 150 L150 350 L350 350 Z"}], []}
%         {path, [{d,"M153 334" ++
%                     "C153 334 151 334 151 334" ++
%                     "C151 339 153 344 156 344" ++
%                     "C164 344 171 339 171 334" ++
%                     "C171 322 164 314 156 314" ++
%                     "C142 314 131 322 131 334" ++
%                     "C131 350 142 364 156 364" ++
%                     "C175 364 191 350 191 334" ++
%                     "C191 311 175 294 156 294" ++
%                     "C131 294 111 311 111 334" ++
%                     "C111 361 131 384 156 384" ++
%                     "C186 384 211 361 211 334" ++
%                     "C211 300 186 274 156 274"}, {style,"fill:white;stroke:red;stroke-width:2"}], []},
%        {defs, [
%             {filter,[{id,myFilter1}],[
%                    {feGaussianBlur,[{in,"SourceGraphic"},{stdDeviation,3}],[]}
%             ]}
%        ]},
%        {ellipse,[{cx,300},{cy,150},{rx,170},{ry,40},{style,"fill:#ff0000;stroke:#000000;stroke-width:2;filter:url(#myFilter1)"}],[]}
%    ]}.
%
% see syntactic sugar for shorter notation for circle, rect, line, ellipse, polygon, polyline, path and style (as in HTML)
%
%    % Mostly all browsers, allows scripting
%    {ehtml, {embed, [{src,"plik.svg"},
%                     {width,300},{height,100},
%                     {type,"image/svg+xml"},
%                     {pluginpage,"http://www.adobe.com/svg/viewer/install/"} % for IE
%                    ]
%    }}.
%
%    % HTML4, but do not allows scripting
%    {ehtml, {object, [{data,"plik.svg"},
%                     {width,300},{height,100},
%                     {type,"image/svg+xml"},
%                     {codebase,"http://www.adobe.com/svg/viewer/install/"} % for IE
%                    ]
%    }}.
%
%    % Mostly all browser.
%    {ehtml, {iframe, [{src,"plik.svg"},
%                     {width,300},{height,100}]}}.
%
%    % HTML5 (just inserts svg directly into HTML5)
%    {ehtml, SVG}.
%
%    % HTML + SVG (translates svg into own namespace, for example: xmlns:svg=)
%    {ehtml, [{'xmlns:svg',"http://www.w3.org/2000/svg"}], {'svg:svg', SVG}}.
%
%
%  MathML:  emathml   %
%
%     mi, mo, mn, mtext, ms, mspace, mglyph
%     mfenced, mfrac, mrow, msqrt, mroot, mstyle, merror, mpadded, mphantom, menclose
%     msup, msub, msubsup
%     munder, mover, munderover
%     mmultiscripts, mprescripts
%     mtable, mtr, mtd, maligngroup, malignmark, mlabeldtr
%     maction
%     apply, power, plus, divide, minus, times, ci, cn, compose, cos, sin, intersect, transpose, and
%     reln, eq, geq, leq, lt, subset
%     interval, vector, matrix, matrixrow
%     set, bvar, condition
%     sum, int, prod, lowlimit, uplimit
%     diff, partialdiff, degree
%     lambda, log, limit
%     semantics
%     annotation



% Other templates:
%
% http://forum.trapexit.org/viewtopic.php?t=9342
% Written By: Vladimir Sekissov,
%  STL as `Simple Template Language' is a clone of
%  Bruce R. Lewis's BRL (http://brl.sourceforge.net)
%  implemented in Erlang. It deals with template
%  processing and has most capabilities which user
%  expects from web template engines.
%



% other things too look:
%   glade for GTK+
%   rapicorn
%   xrc for wxWidgets
%   Microsoft WFC and .NET classes

