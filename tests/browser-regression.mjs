/** Run with the documented cua_repl Tab API after the local preview finishes loading.
 * const {runWalkingRegression}=await import('/absolute/path/tests/browser-regression.mjs');
 * await runWalkingRegression(tab, result => nodeRepl.write(result));
 * Uses real browser keyboard/pointer input, rather than calling scene methods.
 */
export async function runWalkingRegression(tab,report=()=>{}){
 const results=[];const state=async()=>JSON.parse(await tab.playwright.evaluate(()=>document.querySelector('canvas')?.getAttribute('data-camera')));
 const check=(name,pass,details)=>{const result={name,pass,...details};results.push(result);report(result);if(!pass)throw Error('Walking regression failed: '+name)};
 const refresh=()=>tab.getAXState({emit:false});const button=name=>tab.playwright.getByRole('button',{name,exact:true});
 const key=async k=>{await tab.pressKey(null,k,{durationMs:700});await refresh();return state()};
 if(await button('Enter the street').isVisible()){if(!await button('Enter the street').isEnabled())throw Error('Wait for scene loading before running this suite');await button('Enter the street').click();await refresh()}
 let before=await state(),after=await key('w');check('keyboard works while water dialog is initially closed',after.z<before.z-.2,{before,after});
 await button('Explore rainwater harvesting').click();await refresh();before=await state();after=await key('w');check('open modal pauses walking',after.modalOpen&&Math.hypot(after.x-before.x,after.z-before.z)<.02,{before,after});
 await button('Close rainwater diagram').click();await refresh();before=await state();after=await key('w');check('closing water dialog restores walking',!after.modalOpen&&after.z<before.z-.2,{before,after});
 await button('Go to Craft lane').click();await refresh();before=await state();after=await key('Up');check('destination changes retain keyboard control',after.z<before.z-.2,{before,after});
 before=await state();await button('Walk forward').press('Enter');await refresh();after=await state();check('direction button supports single-step keyboard activation',after.z<before.z-.15,{before,after});
 const ax=await tab.getAXState({disableDiffing:true,emit:false});const index=Number(ax.match(/\n\s*(\d+) button Walk forward/)?.[1]);if(!Number.isFinite(index))throw Error('Native movement button not found');before=await state();await tab.click(index,{durationMs:700});await refresh();after=await state();check('direction button supports held-pointer movement',after.z<before.z-.2,{before,after});
 before=await state();await tab.getScreenshot({emit:false});await refresh();after=await state();check('released pointer does not leave movement stuck',Math.hypot(after.x-before.x,after.z-before.z)<.02,{before,after});
 await button('Guided walk').click();await refresh();await key('w');check('manual movement cancels guided travel',(await button('Guided walk').isVisible())&&!(await button('End tour').isVisible()),{camera:await state()});
 await button('Enter fullscreen').click();await refresh();before=await state();after=await key('w');check('keyboard walking works in fullscreen',after.z<before.z-.2,{before,after});
 await button('Exit fullscreen').click();await refresh();await tab.playwright.getByText('Restoring the 3D view… walking resumes automatically.',{exact:true}).waitFor({state:'hidden',timeoutMs:12000});before=await state();after=await key('w');check('walking survives exit from fullscreen',after.z<before.z-.2,{before,after});return results;
}
