// Relay-specific UI and diagnostic copy. Game identifiers stay unchanged.
export const RELAY_MESSAGES: readonly (readonly [string, string])[] = `
任务|Tasks
自动刷新游戏页|Automatically reload game page
后台空闲满 6 小时，或确认页面卡住时刷新|Reload after 6 hours idle in the background or a confirmed stall
远征兜底检查间隔（分钟）|Expedition fallback check interval (minutes)
首次请在游戏中打开无人机建造任务|Open Wings of Mars in the game to capture its first snapshot
后台空闲刷新|Background idle reload
启动读取恢复|Startup read recovery
ICE Wall 等待超时|ICE Wall connection timeout
终端连接超时|Terminal connection timeout
终端正在连接，持续 3 分钟无进展后刷新|Terminal is connecting. Reloads after 3 minutes without progress.
ICE Wall 正在连接，持续 3 分钟无进展后刷新|ICE Wall is connecting. Reloads after 3 minutes without progress.
终端正在连接，自动刷新已关闭|Terminal is connecting; automatic reload is off
远征名单读取已超时，观察中|Expedition roster timed out; monitoring
远征名单读取已超时，保留当前任务|Expedition roster timed out; current activity protected
远征名单读取已超时，自动刷新已关闭|Expedition roster timed out; automatic reload is off
ICE Wall 正在连接，自动刷新已关闭|ICE Wall is connecting. Automatic reload is off.
远征名单读取持续超时，已保留当前操作或排队任务|Expedition roster is still overdue. Pending work is protected.
远征名单读取超时|Expedition roster read timeout
配装回执超时|Equipment confirmation timeout
今日已领取|Claimed today
今日未领取|Unclaimed today
操作|Operations
状态|Status
界面语言|Interface language
参数|Parameter
当前|Current
所选|Selected
功耗|Power consuming
功耗|Power draw
核心数|Cores count
核心数|Cores
频率|Frequency
算力|Compute power
显存|VRAM
内存|Memory
供电|Supply
防护|Protection
漏洞率|Vulnerability
漏洞率 %|Vulnerability %
功能|Function
能力范围|Power range
资源需求|Resources
需求范围|Demand range
当前占用|Allocated
已安装|Installed
未安装|Not installed
尚未读取到这件硬件的参数|Parameters for this hardware have not been read
尚未读取到这件软件的功能参数|Function parameters for this software have not been read
选择硬件以查看参数|Select hardware to view parameters
选择软件以查看功能参数|Select software to view function parameters
语言|Language
设置未读取|Settings not read
默认|Default
深渊|Abyss
虚空|Void
星云|Nebula
战术|Tactical
赛博朋克|Cyberpunk
海洋|Ocean
余烬|Ember
极地|Arctic
原始|Original
（暂停自动操作，保留设置）|(pauses automation; preserves settings)
在侧栏打开|Open as side panel
更换主题|Change theme
刷新全部数据|Refresh all data
刷新 Daily|Refresh Daily Ops
固定 Daily 计时|Pin Daily Ops
固定市场计时|Pin Market Timer
刷新已归档远征|Refresh Archived
暂无市场缓存。|No market data cached yet.
暂无市场数据。|No market data available.
请确认已打开 cor3.gg 游戏页。|Make sure you have the cor3.gg tab open.
优先最便宜|Prefer the lowest cost
雇佣兵|Mercenary
目的地|Destination
每次总费用上限（CR）|Total cost cap per expedition (CR)
低于此余额暂停（CR）|Pause below this balance (CR)
未找到 cor3.gg 标签页|No cor3.gg tab found
侧栏未打开。请在当前游戏标签使用插件弹窗。|The sidebar did not open. Use the extension popup in the current game tab.
偏好已保存，但总闸在保存期间改变；未发送运行命令。|Preference saved, but the master switch changed during saving. No run command was sent.
偏好已保存；当前暂停，不启动自动化。|Preference saved; automation remains paused.
偏好保存结果未确认：|Preference save is unconfirmed:\x20
未找到 cor3.gg 标签页，请打开游戏页面|No cor3.gg tab found. Open the game page.
当前总闸为暂停；三个破解偏好可保存，但不会启动。已提交的游戏动作无法撤回。|Automation is paused. Puzzle preferences can be saved but will not run. Submitted game actions cannot be withdrawn.
三个解密功能按当前页面偏好运行，无需账号探测；其他功能仍单独核验账号。|Puzzle solvers use this page's preferences without account identification. Other features verify the account separately.
当前游戏页面未确认，设置尚未读取；不代表关闭或暂停。|The game page is unconfirmed and settings have not been read. This does not indicate that they are off or paused.
正在保存暂停设置…|Saving the pause setting…
正在保存恢复设置…|Saving the resume setting…
后台核对超时，结果未知。|Background verification timed out. The result is unknown.
后台未应答，无法确认总开关。|The background did not respond. The master switch could not be verified.
个游戏上下文未确认，请检查页面状态后重新打开插件。|game contexts are unconfirmed. Check the page and reopen the extension.
尚未全部确认：|Not fully confirmed:\x20
已保存暂停设置；已经提交的游戏动作无法撤回。|Pause saved. Already submitted game actions cannot be withdrawn.
三个解密功能已允许按当前页面偏好运行，无需再次刷新；其他功能仍需账号核验。|Puzzle solvers may run with this page's preferences. No refresh is needed; other features still verify the account.
停止/保存结果未知：|Stop/save result unknown:\x20
。不要把未知当作保存成功。|. An unknown result does not confirm a successful save.
检测到：|Detected:\x20
参考版本：|Reference version:\x20
目标系统版本：|Target system version:\x20
自动|Automatic
当前页暂无远征事件|No expedition events on this page
当前游戏页日志不可用|Current game page logs are unavailable
当前游戏页面已变化，请重新打开插件。三个开关未改到其他页面。|The game page changed. Reopen the extension. No puzzle switches were changed on another page.
请在当前 COR3 游戏标签页打开插件。三个解密功能不需要账号身份探测。|Open the extension on the current COR3 game tab. Puzzle solvers do not need account identification.
三个解密功能已连接当前游戏页面，无需识别账号。其他功能单独核验账号。|Puzzle solvers are connected to this game page without account identification. Other features verify the account separately.
正在加载市场数据…|Loading market data...
自动远征|Auto expedition
投保|Add insurance
远征优先级（可选）|Expedition priority (optional)
自动领取奖励|Auto-claim rewards
自动处理事件|Auto-resolve decisions
优先 USOL 雇佣兵|USOL mercenaries first
忽略精英雇佣兵|Ignore elite mercenaries
优先最低费用|Cheapest mercenary first
指定雇佣兵|Pinned mercenary
远征地点|Expedition location
启用费用限制|Apply cost limit
费用上限|Max cost
自定义事件权重|Custom decision weights
战利品／风险权重|Loot / risk weight
消耗老兵|Get rid of veterans
让老兵远征偏向高风险选项，以消耗老兵。|Biases VETERAN mercenary expeditions toward risky decisions to consume them — not to keep them.
余额低于此值暂停|Pause below CR
余额低于此值时暂停新的雇佣兵远征，恢复后自动继续；不影响领取已获得的奖励。|Pauses NEW mercenary expeditions when credits fall below this value; resumes automatically when credits recover. Does not block claiming already-earned rewards.
自动维修|Auto repair
自动选择任务|Auto-choose mission
目的地／任务|Destination / mission
仅满电后派遣|Launch only when fully charged
耐久低于此值维修|Repair below durability
电量低于此值维修|Repair when battery below
维修失败时暂停|Pause if repair fails
自定义事件权重|Custom event weights
整理可能需要较长时间，请勿刷新或关闭页面。整理期间暂停邮箱自动收取。|Sorting may take a long time. Do not refresh or close the page. Mailbox auto-collect is paused while sorting.
查看|View
加载|Load
开发测试|Dev TCs
开关|Toggles
测试开关 1（占位）|TC Toggle 1 (placeholder)
测试开关 2（占位）|TC Toggle 2 (placeholder)
测试开关 3（占位）|TC Toggle 3 (placeholder)
触发脚本|Trigger Scripts
测试脚本 1（占位）|TC Script 1 (placeholder)
目标：|Target:
测试服务器可达性|Test reachability to a server
服务器：|Server:
— 请先读取地图 —|— pull map first —
战利品权重|Loot weight
读取 get.map 数据|Pull get.map data
下载文件夹中未找到目标文件|No file found in download folder
Daily 自动|Daily automation
正在|In progress
已在|Already
操作中|Operating
处理中|Processing
冷却|Cooldown
语言保存失败，请重试|Could not save the language. Try again.
运行状态|Runtime status
打开 COR3 Relay|Open COR3 Relay
折叠 Helper|Collapse Helper
关闭 Helper 面板|Close Helper panel
COR3 Helper 页内面板|COR3 Helper in-page panel
Helper 操作|Helper controls
Helper 状态|Helper status
排队|Queued
等待|Waiting
读取|Reading
准备|Preparing
确认|Confirming
执行|Running
核对|Checking
停止|Stopped
结束|Finished
待查|Review needed
未确认|Unconfirmed
已处理|Processed
（已安装）|(installed)
已有硬件|Owned hardware
已有软件|Owned software
硬件|Hardware
软件|Software
对比当前硬件|Compare with installed hardware
系统概览|System Overview
CPU 频率|CPU frequency
CPU 核心数|CPU cores
GPU 算力|GPU compute
GPU 显存|GPU memory
RAM 频率|RAM frequency
RAM 内存|RAM capacity
PSU 供电|PSU power
远征雇佣兵|Expedition mercenary
远征目的地|Expedition destination
未读取|Not read
账号未读取|Account not read
本轮任务正在执行|This batch is running
当前还有操作在运行，请等空闲后再启动|Another operation is running. Wait until it finishes.
操作状态尚未读取|Operation status has not been read
请先关闭自动完成所有任务，再使用单轮模式|Turn off continuous jobs before starting a single batch
请至少选择一种任务|Select at least one task type
市场刷新尚未确认，本轮没有启动任务|Market refresh is unconfirmed. This batch has not started.
任务启动未确认，请查看状态|Task start is unconfirmed. Check status.
页面或账号已变化，请重新读取|The page or account changed. Read the current status again.
当前页面账号未确认|Current page account is unconfirmed
当前账号绑定尚未确认|Account binding is not confirmed yet
自动操作已暂停，设置未更改|Automation is paused. Settings were not changed.
启用前请设置费用上限和余额下限|Set a cost cap and minimum balance before enabling
请输入有效的非负整数金额|Enter a valid non-negative whole amount
无人机尚未可用，未启用|The drone is unavailable and was not enabled
选择已不可用，请重新读取远征|This choice is unavailable. Read expeditions again.
未在当前账号配装中找到所选装备|The selected item was not found in this account's loadout
已有配装操作等待确认，请勿重复提交|An equipment change is awaiting confirmation. Do not submit it again.
未收到新的配装状态|No fresh loadout state was received
插件未接受此操作|The extension did not accept this operation
设置保存尚未确认，请读取状态核对|Saving is unconfirmed. Read status to check.
等待限时操作或当前任务结束|Waiting for the timed activity or current task
自动调度等待手动批次结束|Automatic scheduling is waiting for the manual batch
刷新后的一轮已加入队列|The refreshed batch is queued
本次刷新没有待执行任务|No pending tasks in this refresh
自动任务待核对：|Automatic tasks need review:\x20
请查看日志|Check the logs
已有连续自动任务，未重复启动|Continuous jobs are already enabled. No duplicate batch was started.
任一市场读到新任务后自动排队|New tasks from any market are queued automatically
已关闭自动运行|Automatic batches are off
本轮已排队|This batch is queued
连接正在重新核对；执行结果尚未确认|Rechecking the connection; execution is not confirmed
限时小游戏进行中，市场任务等待|A timed puzzle is active. Market tasks are waiting.
正在刷新市场…|Refreshing markets…
正在启动任务…|Starting tasks…
等待执行器确认；端点仍由本轮占用|Waiting for the executor; this batch still holds the endpoint
正在核对本轮结果|Checking this batch's results
正在执行|Running
端点占用已超时，等待本轮结束确认|Endpoint lease timed out. Waiting for this batch to finish.
缺少兼容的游戏软件|No compatible game software is available.
正在停止，等待当前步骤结束|Stopping after the current step finishes
本轮已结束，请核对明细|Batch finished. Check the results.
本轮已结束，部分市场未读取|Batch finished. Some markets were not read.
本轮已完成，可继续主线|Batch complete. You can continue the story.
本轮已完成，等待当前操作结束|Batch complete. Waiting for the current operation.
本轮已停止，可继续其他事项|Batch stopped. You can continue other work.
已停止，等待当前操作结束|Stopped. Waiting for the current operation.
本轮未确认，请查看状态|Batch unconfirmed. Check status.
部分结果未确认，请核对任务与日志|Some results are unconfirmed. Check tasks and logs.
等待任一市场新任务|Waiting for new tasks from any market
等待手动运行|Waiting for a manual run
取消排队|Cancel queued batch
停止本轮|Stop this batch
执行中|Running
成功|Succeeded
失败|Failed
跳过|Skipped
本轮明细|Batch results
最近任务记录|Recent task history
任务脚本未就绪；本轮未启动，可在状态日志核对|Task engine not ready. The batch did not start. Check status logs.
页面许可已停止；本轮未启动|Page automation is paused. The batch did not start.
执行器启动未确认|Executor start is unconfirmed
刷新时间未读取|Refresh time not read
页面许可开|Page automation allowed
自动操作暂停|Automation paused
空闲|Idle
操作状态未读取|Operation status not read
选择已有硬件|Choose owned hardware
选择已有软件|Choose owned software
暂无已安装硬件|No hardware installed
配装未读取|Loadout not read
配装更新：|Loadout updated:\x20
自动选择|Automatic selection
按插件规则选择|Use extension selection rules
有未保存修改|Unsaved changes
已读取，列表为空|Read successfully; list is empty
已读取|Read successfully
无人机已读取，可用|Drone read successfully; available
已读取，当前无无人机；解锁状态未确认|Read successfully; no drone found. Unlock status is unconfirmed.
无人机读取失败：|Drone read failed:\x20
无人机未读取|Drone not read
未设置|Not set
费用限制：|Cost limit:\x20
上限：|Maximum:\x20
余额保护：|Balance protection:\x20
下限：|Minimum:\x20
远征保险：|Expedition insurance:\x20
无人机维修：|Drone repair:\x20
维修失败暂停：|Pause on repair failure:\x20
远征|Expeditions
无人机|Drone
当前页面暂无运行日志|No runtime logs for this page
解密许可：|Puzzle automation:\x20
解密许可未读取|Puzzle permission not read
配装|Loadout
日常|Daily
市场|Markets
自动读取等待当前任务结束（|Automatic reading waits for the current task (
正在自动读取|Automatically reading\x20
尚未读到：|Not read yet:\x20
等待当前页面许可后自动读取|Waiting for page permission to read automatically
连接正在重新核对|Rechecking the connection
操作状态暂未确认；保留上次读数|Operation state is unconfirmed; showing the last reading
最近读到：|Last observed:\x20
正在自动恢复读取，请勿重复启动或刷新游戏|Recovering the read automatically. Do not restart the task or refresh the game.
当前进度未确认|Current progress is unconfirmed
读取暂时失败，正在重试…|Reading failed temporarily. Retrying…
后台读取超时，可重新展开状态|Background read timed out. Reopen Status to retry.
操作等待超时，结果待核对|Operation timed out. Verify the result.
后台读取超时，正在重试…|Background read timed out. Retrying…
当前无单轮任务|No batch active
当前页面状态未读取|Current page status not read
雇佣兵未读取|Mercenaries not read
保存设置未读取|Saved settings not read
配装状态未读取|Loadout status not read
当前页面日志未读取|Current page logs not read
请使用真实点击操作此按钮|Use an actual click to operate this control
已排队，等待执行|Queued; waiting to run
设置已保存并读回确认|Settings saved and verified
请求已发出，请核对游戏结果|Request sent. Check the result in the game.
操作未确认，请读取状态与日志|Operation unconfirmed. Read status and logs.
执行：|Running:\x20
等待：|Waiting:\x20
端点：|Endpoint:\x20
排队：|Queued:\x20
操作状态未确认|Operation status unconfirmed
本轮已加入队列，进度会自动更新|Batch queued. Progress updates automatically.
已请求取消本轮，等待当前步骤结束|Cancellation requested. Waiting for the current step.
自动市场任务：|Automatic market tasks:\x20
等待任一市场新任务|Waiting for new tasks from any market
已关闭|Off
等待当前限时操作或队列|Waiting for the timed activity or queue
本轮已加入队列|Batch queued
新任务池没有待执行任务|No pending tasks in the new pool
结果待核对|Results need review
正在加入队列|Adding to the queue
等待当前页面许可|Waiting for current page permission
游戏返回配装错误|The game returned an equipment error
游戏配装已确认|Equipment confirmed by the game
配装操作已排队|Equipment change queued
当前配装已满足选择|The current equipment already matches the selection
配装请求已发出，等待游戏确认|Equipment request sent; waiting for game confirmation
配装结果未确认，保留端点占用；读取配装后再次核对|Equipment result unconfirmed; endpoint retained. Read loadout to check again.
配装结果未确认，端点仍被占用|Equipment result unconfirmed; the endpoint is still held
正在等待当前游戏页账号就绪，自动重试中…|Waiting for the game account; retrying automatically…
暂时无法核实当前窗口的 COR3 账号；未选择其他窗口或标签。|Cannot verify the COR3 account in this window. No other window or tab was selected.
账号或文档已变化。请关闭并重新打开此 Helper 界面。|The account or document changed. Close and reopen this Helper interface.
已附着当前检查标签的既有账号连接。|Attached to the existing account connection of the inspected tab.
游戏页未能接收插件身份探测；请确认扩展已载入此页面。|The game page did not receive the identity probe. Check that the extension is loaded.
游戏页身份探测超时，本次未启动。|Game page identity probe timed out. Nothing was started.
页面尚未显示指定账号身份元素，本次未启动。|Account identity is not visible yet. Nothing was started.
页面出现多个账号身份元素，无法唯一确认，本次未启动。|Multiple account identities were found. Nothing was started.
账号身份元素暂时不可见，本次未启动；恢复可见后重新打开插件。|The account identity is hidden. Reopen the extension when it is visible.
账号身份元素格式不符合要求，本次未启动。|The account identity format is invalid. Nothing was started.
无法核验页面身份，本次未启动。|Page identity could not be verified. Nothing was started.
当前页面身份代已失效，请在有效游戏页重新打开插件。|Page identity expired. Reopen the extension on the current game page.
设置升级未完成，本次未启动；重新打开仅核验已完成值并补完成标记，不会重复覆盖设置。|Settings migration is incomplete. Reopening checks completed values without overwriting them again.
设置升级记录与当前设置不一致，本次未启动且未覆盖设置；请提供此提示，由检查确认保留当前值或另行批准修复。|Migration records differ from current settings. No settings were overwritten; review is required.
设置升级组件不可用，本次未启动；请提供此提示检查。|The settings migration component is unavailable. Nothing was started.
无法确定这个插件界面所属的普通浏览器窗口。请在游戏所在窗口打开插件。|Cannot determine this popup's browser window. Open the extension in the game window.
当前窗口有多个 COR3 标签页，无法唯一识别账号。|Multiple COR3 tabs are open in this window. The account cannot be selected uniquely.
当前窗口未找到 COR3 游戏标签页。|No COR3 game tab found in this window.
当前 COR3 页面仍在加载或尚未显示可信账号。|The COR3 page is loading or its account is not ready yet.
另一个窗口已有有效账号连接，当前界面不会抢占。|Another window has an active account connection. This interface will not take it over.
另一个窗口正在识别账号，当前界面不会切换目标。|Another window is identifying an account. This interface will not switch targets.
页面或账号发生变化，请重新打开插件后识别。|The page or account changed. Reopen the extension to identify it again.
终端解密正在等待挑战|Terminal solver is waiting for a challenge
终端解密已开始|Terminal solving started
终端参数已核对并提交一次|Terminal parameters checked and submitted once
终端收到本次反馈，继续缩小候选|Terminal feedback received; narrowing candidates
终端反馈全部匹配|All terminal parameters match
终端已有全部匹配记录|A fully matching terminal record already exists
终端挑战已变化，本次操作结束|Terminal challenge changed; this attempt ended
终端参数切换未确认，未提交答案|Terminal parameter change unconfirmed; answer not submitted
终端字段已变化，未提交答案|Terminal fields changed; answer not submitted
终端参数格式暂不支持，未提交答案|Unsupported terminal parameter format; answer not submitted
终端本次提交反馈未确认，不重复提交|Terminal feedback unconfirmed; no duplicate submission
终端反馈不一致，停止本次猜测|Inconsistent terminal feedback; guessing stopped
终端解密发生错误|Terminal solver error
执行器已接收本轮任务|Executor accepted this batch
当前账号页面许可已确认|Current account page permission confirmed
Helper 已载入此游戏页|Helper loaded into this game page
ICE Wall 自动破解已启动|ICE Wall solver started
ICE Wall 自动破解正在匹配|ICE Wall solver is matching
ICE Wall 自动破解已完成|ICE Wall solver completed
ICE Wall 自动破解报告错误|ICE Wall solver reported an error
收到雇佣兵远征列表|Mercenary expedition list received
收到无人机状态|Drone status received
余额低于设定值，暂缓派遣|Balance below the configured minimum; dispatch deferred
暂未确认余额，暂缓派遣|Balance unconfirmed; dispatch deferred
没有符合规则的雇佣兵或报价|No mercenary or quote matches the configured rules
指定雇佣兵不符合规则，尝试自动选择|Pinned mercenary does not match the rules; trying automatic selection
已发出雇佣兵派遣请求|Mercenary dispatch requested
游戏确认雇佣兵远征已出发|The game confirmed the mercenary expedition started
游戏返回雇佣兵派遣错误|The game returned a mercenary dispatch error
处理雇佣兵远征奖励|Processing mercenary expedition rewards
已发出雇佣兵远征决策|Mercenary expedition decision sent
等待无人机充满电|Waiting for the drone to fully charge
当前没有符合规则的无人机任务|No drone mission matches the current rules
已发出无人机派遣请求|Drone dispatch requested
游戏确认无人机远征已出发|The game confirmed the drone expedition started
已发出无人机维修请求|Drone repair requested
游戏返回无人机操作错误|The game returned a drone operation error
已发出无人机远征决策|Drone expedition decision sent
轮次未推进，已停止本次尝试|The round did not advance; this attempt was stopped
下一轮目标图案未就绪|The next round target was not ready
等待结束前未找到可靠的符文匹配|No reliable glyph match before the deadline
游戏判定本次符文匹配错误|The game rejected the matching glyph
日常任务锁仍在有效期内|Daily lock is still within its lease
已同步当前页面会话，正在查询日常领取状态|Current page session found; checking Daily claim state
匹配点击多次未获确认，已停止本轮|Repeated matching clicks were not confirmed; this round was stopped
读取当前页…|Reading the current page…
游戏页面已变化|Game page changed
游戏页面或账号已变化|Game page or account changed
自动远征 雇佣兵|Automatic expeditions: mercenaries
暂停|Paused
缓存摘要（以更新时间为准）|Cache summary (check update times)
无缓存|No cached data
账号缓存未确认|Account cache unconfirmed
简易解密|Simple decrypt
解密|Decrypt
总暂停|Master pause
页面许可|Page permission
页面连接|Page connection
账号连接|Account connection
会话交接|Session handoff
今日|Today
已领取|Claimed
未领取|Not claimed
完成|Complete
自动领取|Auto claim
自动决策|Auto decide
USOL 优先|Prefer USOL
优先低费用|Prefer lower cost
自动选择任务|Automatically select missions
雇佣兵远征|Mercenary expeditions
雇佣兵自动远征|Automatic mercenary expeditions
无人机远征|Drone expeditions
无人机自动远征|Automatic drone expeditions
暂停无人机|Pause drone
无人机自动领取|Auto claim drone rewards
无人机自动决策|Auto decide drone events
满电后派遣|Dispatch when fully charged
保存雇佣兵设置|Save mercenary settings
保存无人机设置|Save drone settings
市场刷新后自动运行|Run automatically after a market refresh
运行一轮市场任务|Run one market batch
任务类型|Task types
更新状态|Update status
刷新四市场|Refresh all markets
刷新配装|Refresh loadout
刷新远征|Refresh expeditions
刷新无人机|Refresh drone
刷新日常|Refresh Daily
更换硬件|Equip hardware
安装软件|Install software
卸下软件|Uninstall software
费用上限（CR）|Cost cap (CR)
余额下限（CR）|Minimum balance (CR)
启用时保存费用上限与余额下限；保险等其他设置保留。|Enabling saves the cost cap and minimum balance; insurance and other settings are preserved.
缓存与日志|Cache and logs
资源|Resource
维持自动远征所需的最低 CR|Minimum CR to keep auto-expedition running
暂无说明。|No description available.
没有匹配项|no matches
暂无资源数据|No resource data
自动完成所有任务|Auto Finish All Jobs
文件解密|File Decryption
IP 注入|IP Injection
数据下载|Data Download
日志删除|Log Deletion
日志下载|Log Download
解密并提取|Decrypt & Extract
文件删除|File Elimination
数据上传|Data Upload
IP 清理|IP Cleanup
清理失败任务；完成后此按钮会自动隐藏|Clear failed jobs - this button will disappear once cleanup is complete
复制全部调试日志|Copy all debug logs to clipboard
刷新任务数据|Refresh job data
刷新无人机归档远征|Refresh Drone Archived
风险权重|Risk weight
硬件类型|Hardware types
软件类型|Software types
参数未读取|Parameters not read
功能参数未读取|Ability parameters not read
此类装备为空|No items in this category
当前类型未安装硬件|No hardware installed in this category
无人机建造进度|Drone construction progress
账号确认后显示自动调度状态|Market scheduling status will appear once the account is verified.
正在核对账号，显示上次读取的设置|Verifying the account. Showing the last known settings.
各阶段材料参考|Materials by stage (reference)
其他|Other
数值|Value
入侵|Hack
最近读数|Last reading
运行日志|Runtime logs
正在连接当前游戏页面（三个解密功能无需账号探测）…|Connecting to the current game page (puzzle solvers do not need account identification)…
已识别当前窗口账号：|Account in this window:\x20
。功能状态遵循此账号的已保存设置。|. Saved settings for this account apply.
其他功能账号核验|Account verification for other features
其他功能单独核验，不阻挡三个解密开关。|Other features verify the account separately; puzzle toggles remain independent.
（超时，等待结束确认）|(timed out; waiting for completion)
Daily 下次：|Next Daily check:\x20
开|On
关|Off
项|items
`.trim().split('\n').map(line => {
    const split = line.indexOf('|');
    return [line.slice(0, split), line.slice(split + 1)] as const;
});
