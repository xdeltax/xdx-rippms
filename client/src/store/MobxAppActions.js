import {decorate, observable, runInAction, /*toJS,*/} from 'mobx';
import MobxPrototype from "./MobxPrototype";

class MobxAppActions extends MobxPrototype {
  constructor(store) { super(store); /*store init-state of all vars::*/ this.saveInitialState(this._obervables, this._helpers); };

  // init of all observables
  _obervables = {
    loading: {
      isLoadingNow: false,
    },
    saving: {
      isSavingNow: false,
      unsavedChangesUser: false, // if userprofile was changed but no api-call to server triggered by user "save-button"
    },
    spinner: {
		  isSpinnerVisible: false,
		  hintText: "",
    }
  };

  // init of all non-observables
  _helpers = {
  };


  // getter and setter
  get loading() { return this.obervables.loading }
	set loading(v) { runInAction(() => { this.obervables.loading = v; })}

  get saving() { return this.obervables.saving }
	set saving(v) { runInAction(() => { this.obervables.saving = v; })}

  get spinner() { return this.obervables.spinner }
	set spinner(v) { runInAction(() => { this.obervables.spinner = v; })}

    //get isSpinnerVisible() { return this.spinner.isSpinnerVisible }
  	//set isSpinnerVisible(v) { runInAction(() => { this.spinner.isSpinnerVisible = v; })}

	get loadingNowStatus() { return this.obervables.loading.isLoadingNow }
	set loadingNowStatus(v) { runInAction(() => {
		this.loading.isLoadingNow = v;
		if (v === true) {
			this.spinner.isSpinnerVisible = true;
		} else {
			this.spinner.isSpinnerVisible = false;
			this.spinner.hintText = "";
		}
	}) }

	get savingNowStatus() { return this.helpers.isSavingNow }
	set savingNowStatus(v) { runInAction(() => {
		this.saving.isSavingNow = v;
		if (v === true) {
			this.spinner.isSpinnerVisible = true;
		} else {
			this.spinner.isSpinnerVisible = false;
			this.spinner.hintText = "";
		}
	}) }

	get unsavedChangesUser() { return this.saving.unsavedChangesUser }
	set unsavedChangesUser(v) { runInAction(() => { this.saving.unsavedChangesUser = v; }) }

	showSpinner = (text, timeout) => { runInAction(() => {
		this.spinner.hintText = text || "";
		this.spinner.isSpinnerVisible = true;
		if (timeout) {
			this.timer = setTimeout(()=>{
				this.hideSpinner();
				clearInterval(this.timer);
			}, timeout);
		}
	})};

	hideSpinner = () => { runInAction(() => {
		if (this.timer) clearInterval(this.timer);
		this.spinner.isSpinnerVisible = false;
		this.spinner.hintText = "";
  })};

}; // of class

decorate(MobxAppActions, {
  _obervables: observable,
});

export default MobxAppActions;
