D.RepositoryView = Backbone.View.extend({

  tagName: 'div',
  className: 'pane main_pane',

  events: {
    "click .wrench_icon": "showSettings"
  },

  initialize: function (options) {
    _.bindAll(this);
    this.model.bind("change", this.render);
    this.model.bind("destroy", this.remove);
    this.selectedBuild = options.selectedBuild;
  },

  render: function () {
    var frag = $(_.template($("#repository_show_template").html(), {name: this.model.get("name")}));

    frag.find(".build_result").addClass(this.model.status());

    this.el = $(this.el);

    this.el.html(frag);

    if (this.model.get('buildList')) { 
      this.el.append(new D.BuildListView({
        collection: this.model.get("buildList"),
        selectedBuild: this.selectedBuild
      }).render().el);
    }
    else {
      this.el.append("<div class='no_builds'>This repository has no builds yet ☹</div>");
    }

    $(".pane").replaceWith(this.el);

    return this;
  },
  
  showSettings: function () {
    var deleteButton  = $("<a class='btn danger'>Delete repository</a>'"),
        popoverNav    = new D.PopoverNav({items: [deleteButton]}), 
        popoverEl     = $(popoverNav.render().el),
        that          = this,
        left;

    // delete link handler
    deleteButton.bind("click", function () {
      popoverNav.hide();
      that.deleteRepository();
    });

    // append to dom
    $(this.el).find(".repository_name").append(popoverEl);

    // find and set the correct position
    left = ($(this.el).find(".wrench_icon").position().left - (parseInt(popoverEl.css("width")) / 2)) + 10;
    $(popoverNav.el).css({"top": 40, "left": left});

    // show
    popoverNav.show();
  },

  deleteRepository: function () {
    if (confirm("Are you sure you want to delete " + this.model.get("name"))) {
      $(".main_pane").html("Deleting repository, please wait ..");
      this.model.destroy();
    }
  },

  remove: function () {
    var pane = $('<div class="pane"></div>');
    pane.html('<div class="select_repository">Please select a repository on the left</div>');
    $(".main_pane").replaceWith(pane);

    D.appRouter.navigate("/repositories");
  }

});
