"use strict";

(function (b) {
    b.support.touch = "ontouchend" in document;
    if (!b.support.touch) {
        return;
    }
    var c = b.ui.mouse.prototype,
        e = c._mouseInit,
        a;
    function d(g, h) {
        if (g.originalEvent.touches.length > 1) {
            return;
        }
        g.preventDefault();
        var i = g.originalEvent.changedTouches[0],
            f = document.createEvent("MouseEvents");
        f.initMouseEvent(
            h,
            true,
            true,
            window,
            1,
            i.screenX,
            i.screenY,
            i.clientX,
            i.clientY,
            false,
            false,
            false,
            false,
            0,
            null
        );
        g.target.dispatchEvent(f);
    }
    c._touchStart = function (g) {
        var f = this;
        if (a || !f._mouseCapture(g.originalEvent.changedTouches[0])) {
            return;
        }
        a = true;
        f._touchMoved = false;
        d(g, "mouseover");
        d(g, "mousemove");
        d(g, "mousedown");
    };
    c._touchMove = function (f) {
        if (!a) {
            return;
        }
        this._touchMoved = true;
        d(f, "mousemove");
    };
    c._touchEnd = function (f) {
        if (!a) {
            return;
        }
        d(f, "mouseup");
        d(f, "mouseout");
        if (!this._touchMoved) {
            d(f, "click");
        }
        a = false;
    };
    c._mouseInit = function () {
        var f = this;
        f.element
            .bind("touchstart", b.proxy(f, "_touchStart"))
            .bind("touchmove", b.proxy(f, "_touchMove"))
            .bind("touchend", b.proxy(f, "_touchEnd"));
        e.call(f);
    };
})(jQuery);

(function ($) {
    $(document).ready(function () {
        App.init();
    });

    var App = {
        init: function () {
            $("[data-media_manager]").each(function () {
                let container = $(this);
                new MediaManager(container);
            });
        },
    };

    class MediaManager {
        constructor(container) {
            this.container = container;
            this.sourceList = this.container.find("[data-media_source]");
            this.destinationList = this.container.find("[data-media_destination]");
            this.source = {};

            this.loadItems();
            this.moveHandlers();
            this.sourceNameInput();
        }

        sourceNameInput() {
            $(document).on("click", "[data-source_name_button]", function () {
                const input = $("[data-source_name_input]");
                if (input.attr("readonly")) {
                    input.attr("readonly", false);
                    input.focus();
                    input.select();
                } else {
                    input.attr("readonly", true);
                }
            });

            $(document).on("blur", "[data-source_name_input]", function () {
                const input = $("[data-source_name_input]");
                input.attr("readonly", true);
            });
        }

        moveHandlers() {
            const _this = this;
            $(document).on("click", "[data-move_item_to]", function (e) {
                e.preventDefault();
                const type = $(this).data("move_item_to");
                const container = $(this).closest("[data-id]");
                const id = container.data("id");

                if (container.hasClass("disabled")) return;
                if (type == "destination") {
                    container.addClass("disabled");
                }

                _this.move(id, type);
            });

            $(document).on("click", "[data-move_up]", function () {
                const element = $(this).closest("[data-id]");
                const prev = element.prev("[data-id]");
                if (prev.length) {
                    element.insertBefore(prev);
                }
            });

            $(document).on("click", "[data-move_down]", function () {
                const element = $(this).closest("[data-id]");
                const next = element.next("[data-id]");
                if (next.length) {
                    element.insertAfter(next);
                }
            });
        }

        move(id, type) {
            if (type == "destination") {
                this.addItemToDestinationList(id);
            } else if (type == "source") {
                this.removeItemFromDestinationList(id);
            }
        }

        findItem(id) {
            let item = null;
            $.each(this.source, function (i, v) {
                if (v.id == id) item = v;
            });
            return item;
        }

        loadItems() {
            const url = this.sourceList.data("media_source");
            fetch(url)
                .then((response) => {
                    return response.json();
                })
                .then((response) => {
                    this.source = response;
                    this.renderSourceList();
                });
        }

        renderSourceList() {
            $.each(this.source, (i, item) => {
                let html = this.renderSourceItem(item);
                this.sourceList.append(html);
            });
            this.runSortables();
        }

        runSortables() {
            const _this = this;
            $("[data-media_source]")
                .sortable({})
                .droppable({
                    drop: function (e, ui) {
                        let element = ui.helper;
                        if (element.hasClass("destination-item") && element.data("id")) {
                            let id = element.data("id");
                            _this.removeItemFromDestinationList(id);
                        }
                    },
                });

            $("[data-media_destination]")
                .sortable({})
                .droppable({
                    drop: function (e, ui) {
                        let element = ui.helper;
                        if (element.hasClass("source-item") && element.data("id")) {
                            let id = element.data("id");
                            _this.addItemToDestinationList(id);
                        }
                    },
                });
        }

        addItemToDestinationList(id) {
            const item = this.findItem(id);
            const template = this.renderDestinationItem(item);
            $("[data-media_destination]").prepend(template);
            $("[data-media_source]").find(`[data-id="${id}"]`).addClass("disabled");
        }

        removeItemFromDestinationList(id) {
            $("[data-media_destination]").find(`[data-id="${id}"]`).remove();
            $("[data-media_source]").find(`[data-id="${id}"]`).removeClass("disabled");
        }

        renderSourceItem(item) {
            let template = `
            <div class="item d-flex align-items-center justify-content-between source-item"	data-id="{{id}}">
				<div class="d-flex flex-column flex-lg-row align-items-lg-center">
                    <div class="media-thumbnail d-flex align-items-center justify-content-between">
                        <img class="img-fluid media-thumb" src="{{thumbnail}}">
                        <button class="btn btn-link transfer-btn d-flex d-lg-none align-items-center justify-content-center" data-move_item_to="destination">
                            <img class="img-fluid" src="assets/img/arrow.svg">
                        </button>
                    </div>
                    <div class="media-title">
                        {{file}}
                    </div>
                    <div class="media-time">
                        {{duration}}
                    </div>
                </div>
                <button class="btn btn-link transfer-btn d-none d-lg-flex align-items-center justify-content-center" data-move_item_to="destination">
                    <img class="img-fluid" src="assets/img/arrow.svg">
                </button>
            </div>`;

            template = this.renderTokens(template, item);

            return template;
        }

        renderTokens(template, item) {
            const tokens = ["file", "thumbnail", "duration", "id"];
            tokens.forEach(function (token) {
                template = template.replace(`{{${token}}}`, item[token]);
            });

            return template;
        }

        renderDestinationItem(item) {
            let template = `
            <div class="item d-flex align-items-center justify-content-between destination-item"	data-id="{{id}}">
				<div class="d-flex flex-column flex-lg-row align-items-lg-center">
                    <div class="media-thumbnail d-flex align-items-center justify-content-between">
                        <img class="img-fluid media-thumb" src="{{thumbnail}}">
                        <button class="btn btn-link transfer-btn d-flex d-lg-none align-items-center justify-content-center">
                            <img class="img-fluid" src="assets/img/arrow.svg">
                        </button>
                    </div>
                    <div class="media-title">
                        {{file}}
                    </div>
                    <div class="media-time">
                        {{duration}}
                    </div>
                </div>
                <div class="r-col">
                    <button class="btn-link move-up-btn" data-move_up>
                        <img class="img-fluid" src="assets/img/move-up.svg">
                    </button>
                    <button class="btn-link move-down-btn" data-move_down>
                        <img class="img-fluid" src="assets/img/move-down.svg" >
                    </button>
                    <button class="btn-link remove-btn" data-move_item_to="source">
                        <img class="img-fluid" src="assets/img/close-x.svg">
                    </button>
                </div>
            </div>`;

            template = this.renderTokens(template, item);

            return template;
        }
    }
})(jQuery);







        document.getElementById('addDateTime').addEventListener('click', function() {
            // Pobieranie wartości pól formularza
            const date = document.getElementById('date').value;
            const timeFrom = document.getElementById('timeFrom').value;
            const timeTo = document.getElementById('timeTo').value;
            const today = new Date().toISOString().split('T')[0]; // Dzisiejsza data w formacie YYYY-MM-DD

            // Usuwanie poprzednich błędów
            document.getElementById('dateError').textContent = '';
            document.getElementById('timeFromError').textContent = '';
            document.getElementById('timeToError').textContent = '';

            let hasError = false;

            // Walidacja daty
            if (!date) {
                document.getElementById('dateError').textContent = 'uzupełnij pole';
                hasError = true;
            } else if (date < today) {
                document.getElementById('dateError').textContent = 'data nie może być wcześniejsza niż dzisiejsza';
                hasError = true;
            }

            // Walidacja godzin
            if (!timeFrom) {
                document.getElementById('timeFromError').textContent = 'uzupełnij pole';
                hasError = true;
            }
            if (!timeTo) {
                document.getElementById('timeToError').textContent = 'uzupełnij pole';
                hasError = true;
            } else if (timeTo <= timeFrom) {
                document.getElementById('timeToError').textContent = 'godzina "Do" musi być późniejsza niż godzina "Od"';
                hasError = true;
            }

            // Jeśli nie ma błędów, dodaj wiersz do tabeli
            if (!hasError) {
                const row = `<tr>
                    <td>${date}</td>
                    <td>${timeFrom}</td>
                    <td>${timeTo}</td>
                    <td class="text-end"><span class="remove-item-btn"><img class="img-fluid motion" src="assets/img/close-x.svg"></span></td>
                </tr>`;
                document.getElementById('dateTimeTableBody').insertAdjacentHTML('beforeend', row);

                // Resetowanie formularza po dodaniu
                document.getElementById('dateTimeForm').reset();
            }
        });

        // Delegacja zdarzeń na przyciskach "x" do usuwania wierszy
        document.getElementById('dateTimeTableBody').addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('remove-item-btn')) {
                const row = e.target.closest('tr');
                row.remove();
            }
        });









        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('collapsed');
            document.querySelector('.toggle-btn').classList.toggle('collapsed');
        }






document.getElementById('repeatAllDaysOption').addEventListener('change', function() {
    if (this.checked) {
        document.getElementById('allDaysTimeRange').style.display = 'flex';
        document.getElementById('daysSelection').style.display = 'none';
        
        // Wyłącz wszystkie dni tygodnia
        const dayCheckboxes = document.querySelectorAll('.day-checkbox');
        dayCheckboxes.forEach(function(checkbox) {
            checkbox.checked = false;
            checkbox.disabled = true;
            const timeRange = checkbox.parentElement.querySelector('.time-range');
            timeRange.style.display = 'none';
        });
    }
});

document.getElementById('selectDaysOption').addEventListener('change', function() {
    if (this.checked) {
        document.getElementById('allDaysTimeRange').style.display = 'none';
        document.getElementById('daysSelection').style.display = 'block';

        // Włącz możliwość wyboru dni tygodnia
        const dayCheckboxes = document.querySelectorAll('.day-checkbox');
        dayCheckboxes.forEach(function(checkbox) {
            checkbox.disabled = false;
        });
    }
});

const dayCheckboxes = document.querySelectorAll('.day-checkbox');
dayCheckboxes.forEach(function(checkbox) {
    checkbox.addEventListener('change', function() {
        const timeRange = this.parentElement.querySelector('.time-range');
        timeRange.style.display = this.checked ? 'flex' : 'none';
    });
});




        document.addEventListener('DOMContentLoaded', () => {
            const editButton = document.getElementById('editButton');
            const editableInput = document.getElementById('editableInput');
            
            editButton.addEventListener('click', () => {
                if (editButton.textContent === 'Edytuj') {
                    // Zmień tekst przycisku na "Zapisz"
                    editButton.textContent = 'Zapisz';
                    // Usuń atrybut readonly i klasę input-readonly
                    editableInput.removeAttribute('readonly');
                    editableInput.classList.remove('input-readonly');
                    editableInput.focus();
                    editableInput.select();
                } else {
                    // Zmień tekst przycisku na "Edytuj"
                    editButton.textContent = 'Edytuj';
                    // Dodaj atrybut readonly i klasę input-readonly
                    editableInput.setAttribute('readonly', 'true');
                    editableInput.classList.add('input-readonly');
                }
            });

            // Automatyczna edycja po kliknięciu w input
            editableInput.addEventListener('click', () => {
                if (editButton.textContent === 'Edytuj') {
                    // Zaznacz cały tekst w input, jeśli nie jesteśmy w trybie edycji
                    editableInput.focus();
                    editableInput.select();
                }
            });
        });

