import React, { act, useEffect, useState } from "react"
import FormSaveOrReview from "./FormSaveOrReview"
import * as Html from '../../Services/Html'
import Combobox from "../Widgets/Combobox"



const InvalidAttributeForm = ({
  t,
  settings,
  activeIssue,
  handleIssueSave,
  isDisabled,
  handleActiveIssue,
  markAsReviewed,
  setMarkAsReviewed
}) => {

  const [isScopeValidError, setIsScopeValidError] = useState(false)
  const[selectedScope, setSelectedScope] = useState("")
  const [useScope, setUseScope] = useState(true)
  const [removeRole, setRemoveRole] = useState(false) // What will be used to trigger role removal from tables
  const [formErrors, setFormErrors] = useState([]) // Keeping track of all form errors in our inputs

  const [removeAttr, setRemoveAttr] = useState(false)

  const scope_options_arr = ['row', 'col', 'rowgroups', 'colgroups']
  const [scopeOptions, setScopeOptions] = useState([])

  useEffect(() => {
    if(!activeIssue){
        return
    }

    const rule = activeIssue.scanRuleId
    if(rule != "table_aria_descendants"){
        setIsScopeValidError(true)
    }

    // Scope logic for setting the current scope
    const html = Html.getIssueHtml(activeIssue)
    let scope = Html.getAttribute(html, scope)

    const tempSelectedScope = scope_options_arr.includes(scope) ? scope : ''
     let tempSelectOptions = [
      { value: '', name: t('form.invalid_attribute.msg.none_selected'), selected: tempSelectedScope === '' }
    ]
    scope_options_arr.forEach(tag => {
      tempSelectOptions.push({
        value: tag,
        name: tag,
        selected: tag === tempSelectedScope
      })
    })

    setScopeOptions(tempSelectOptions)
    setSelectedScope(tempSelectedScope)
    setRemoveRole(false) // Assume we are not removing role
    setFormErrors([])

  }, [activeIssue])

  useEffect(() => {
    updateHtmlContent()
    checkFormErrors()
  }, [removeRole, selectedScope, useScope, isScopeValidError])


  const checkFormErrors = () => {
    const tempErrors = []

    // When we are not dealing with scope issues, we just want to make sure the user is actually removing the role attribute
    if(!isScopeValidError){
        if(!removeAttr){
            tempErrors.push({text: t(`form.invalid_attribute.msg.must_remove_attribute`), type: 'error'})
        }
        setFormErrors(tempErrors)
        return
    }

    // If we are using scope we must ensure it is valid 
    if(!selectedScope && useScope){
        tempErrors.push({text: t(`form.invalid_attribute.msg.must_select_attribute`), type: 'error'})
    }

    setFormErrors(tempErrors)
    return
  }

  const updateHtmlContent = () => {
    let issue = activeIssue
    issue.isModified = true

    if (markAsReviewed) {
      issue.newHtml = issue.initialHtml
      handleActiveIssue(issue)
      return
    }

    const html = Html.getIssueHtml(activeIssue)
    let element = Html.toElement(html)

    if(!isScopeValidError){
        if(removeRole){
            element = Html.removeAttribute(element, "role")
        }
    }
    else{ // We are on scope issue
        if(useScope){ // We are using scope
            element = Html.setAttribute(element, "scope", selectedScope)
        }
        else{ 
            element = Html.removeAttribute(element, "scope")
        }
    }

    issue.newHtml = Html.toString(element)
    handleActiveIssue(issue)
  }

const handleComboboxSelect = (id, value) => {
    setSelectedScope(value)
  }

const handleRemoveAttribute = () => {
    if(isScopeValidError){
        setUseScope(!useScope)
    }
    else{
        setRemoveRole(!removeRole)
    }

    setRemoveAttr(!removeAttr)
}

  const handleSubmit = () => {
    if(formErrors.length == 0 || markAsReviewed){
        handleIssueSave(activeIssue)
    }
  }





  return (
    <>
    <Combobox
        handleChange={handleComboboxSelect}
        id='scope-select'
        isDisabled={isDisabled || !isScopeValidError || removeAttr}
        label={t('form.invalid_attribute.label.select')}
        options={scopeOptions}
        settings={settings} />
    <div className="separator mt-2">{t('fix.label.or')}</div>
    <div className="flex-row justify-content-start gap-1 mt-2">
        <input
          type="checkbox"
          id="useScopeCheckbox"
          name="useScopeCheckbox"
          tabIndex="0"
          disabled={isDisabled}
          checked={removeAttr}
          onChange={handleRemoveAttribute} />
        <label htmlFor="decorativeCheckbox" className="instructions">{t('form.invalid_attribute.label.remove_invalid')}</label>
      </div>
        <FormSaveOrReview
            t={t}
            settings={settings}
            activeIssue={activeIssue}
            isDisabled={isDisabled}
            handleSubmit={handleSubmit}
            formErrors={formErrors}
            markAsReviewed={markAsReviewed}
            setMarkAsReviewed={setMarkAsReviewed} />
        
    </>
  )
}

export default InvalidAttributeForm