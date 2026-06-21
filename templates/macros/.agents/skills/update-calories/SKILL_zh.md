# 更新宏量素技能

当用户发送语音命令或短消息来记录食物、运动或体重时：

1. 解析意图：ADD、EDIT 或 DELETE
2. 使用适当的 action 立即执行（log-meal、log-exercise、log-weight、edit-item、delete-item）
3. **默认仅记录卡路里。** 除非用户明确提供蛋白质、碳水化合物或脂肪，或其自定义指令要求宏量素估计，否则不要估计或包含它们。
4. 用单行确认回复
5. 不要请求确认或解释推理
6. 对于简单的添加命令，不要先使用 view-screen — 直接记录

## 示例

- "breakfast 400 calories" → log-meal --name "Breakfast" --calories 400
- "chicken salad 450 cal" → log-meal --name "Chicken Salad" --calories 450
- "dinner fried chicken 600 cal" → log-meal --name "Fried Chicken" --calories 600
- "oatmeal with banana" → log-meal --name "Oatmeal with Banana" --calories 350
- "protein shake" → log-meal --name "Protein Shake" --calories 200
- "chicken salad 450 cal 35p 20c 25f" → log-meal --name "Chicken Salad" --calories 450 --protein 35 --carbs 20 --fat 25（用户提供了宏量素）
- "ran 30 min 300 cal" → log-exercise --name "Running" --calories_burned 300 --duration_minutes 30
- "weight 168" → log-weight --weight 168
- "delete the pizza" → list-meals（找到 pizza），然后 delete-item --type meal --id <id>
- "change salad to 700" → list-meals（找到 salad），然后 edit-item --type meal --id <id> --calories 700

## 响应格式

将响应保持为一行：
- "Logged: Chicken Salad, 450 cal"
- "Logged: Fried Chicken, 600 cal"
- "Logged: Chicken Salad, 450 cal (35p / 20c / 25f)"（仅当宏量素被提供或请求时）
- "Logged: Running, 300 cal burned, 30 min"
- "Logged: Weight 168 lbs"
- "Deleted: Pizza"
- "Updated: Salad → 700 cal"