import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Utensils, 
  ChefHat, 
  Zap, 
  Search,
  ArrowRight,
  Flame,
  Dna,
  Wheat,
  Trash2,
  Edit2,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { User, FoodLog, Challenge } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface FoodLogViewProps {
  user: User;
  challenge: Challenge;
}

export default function FoodLogView({ user, challenge }: FoodLogViewProps) {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecipePage, setShowRecipePage] = useState(false);
  const [recipeCategory, setRecipeCategory] = useState('Low Carb');
  const [editingFood, setEditingFood] = useState<FoodLog | null>(null);
  const [newFood, setNewFood] = useState<Partial<FoodLog>>({
    meal_type: 'breakfast',
    food_name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const res = await fetch(`/api/food/${user.id}/${today}`);
    const data = await res.json();
    setLogs(data);
  };

  const handleAddFood = async () => {
    if (editingFood) {
      await fetch(`/api/food/${editingFood.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFood)
      });
    } else {
      await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          date: today,
          ...newFood
        })
      });
    }
    fetchLogs();
    setShowAddModal(false);
    setEditingFood(null);
  };

  const handleDeleteFood = async (id: number) => {
    if (window.confirm("Delete this entry?")) {
      await fetch(`/api/food/${id}`, { method: 'DELETE' });
      fetchLogs();
    }
  };

  const generateAIRecipes = async (category: string) => {
    try {
      setLoadingRecipes(true);
      setRecipeCategory(category);
      const macros = { 
        protein: challenge.macro_protein, 
        carbs: challenge.macro_carbs, 
        fat: challenge.macro_fat 
      };
      const res = await fetch('/api/ai/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, macros, diabetes: user.has_diabetes })
      });
      if (!res.ok) throw new Error('Failed to fetch recipes');
      const data = await res.json();
      setRecipes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Recipe generation error:", error);
      setRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const totals = logs.reduce((acc, curr) => ({
    cal: acc.cal + curr.calories,
    p: acc.p + curr.protein,
    c: acc.c + curr.carbs,
    f: acc.f + curr.fat
  }), { cal: 0, p: 0, c: 0, f: 0 });

  if (showRecipePage) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowRecipePage(false)}
            className="p-2 hover:bg-white/5 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-display font-bold tracking-tight">AI Recipes</h1>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['Low Carb', 'Low Sugar', 'Weight Loss', 'Protein Heavy'].map(cat => (
            <button
              key={cat}
              onClick={() => generateAIRecipes(cat)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                recipeCategory === cat ? "bg-brand-accent text-white" : "bg-white/5 text-brand-muted hover:bg-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recipes.map((recipe, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{recipe.name}</h3>
                <span className="text-brand-accent font-bold">{recipe.macros.cal} kcal</span>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-brand-muted mb-2">Ingredients</h4>
                  <ul className="text-sm space-y-1">
                    {recipe.ingredients.map((ing: string, j: number) => (
                      <li key={j} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-brand-accent rounded-full" />
                        {ing}
                        <button 
                          onClick={() => {
                            const sub = window.prompt(`Substitute for ${ing}?`);
                            if (sub) {
                              const newRecipes = [...recipes];
                              newRecipes[i].ingredients[j] = sub;
                              setRecipes(newRecipes);
                            }
                          }}
                          className="text-[10px] text-brand-accent hover:underline ml-auto"
                        >
                          Swap
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-brand-muted mb-2">Instructions</h4>
                  <p className="text-sm text-brand-muted leading-relaxed">{recipe.instructions}</p>
                </div>
                <div className="flex justify-between pt-4 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-xs text-brand-muted uppercase font-bold">Protein</p>
                    <p className="font-bold">{recipe.macros.p}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-brand-muted uppercase font-bold">Carbs</p>
                    <p className="font-bold">{recipe.macros.c}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-brand-muted uppercase font-bold">Fat</p>
                    <p className="font-bold">{recipe.macros.f}g</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {loadingRecipes && (
            <div className="col-span-full py-20 text-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-brand-muted">Forging your personalized recipes...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold tracking-tight">Fuel Log</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowRecipePage(true)}
            className="bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl transition-all"
          >
            <ChefHat size={24} />
          </button>
          <button 
            onClick={() => {
              setEditingFood(null);
              setNewFood({ meal_type: 'breakfast', food_name: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
              setShowAddModal(true);
            }}
            className="bg-brand-accent hover:bg-blue-600 text-white p-3 rounded-xl accent-glow transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Macro Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Calories', value: totals.cal, target: challenge.macro_calories, icon: Flame, color: 'text-orange-400' },
          { label: 'Protein', value: totals.p, target: challenge.macro_protein, icon: Dna, color: 'text-blue-400' },
          { label: 'Carbs', value: totals.c, target: challenge.macro_carbs, icon: Wheat, color: 'text-emerald-400' },
          { label: 'Fat', value: totals.f, target: challenge.macro_fat, icon: Zap, color: 'text-yellow-400' },
        ].map((stat, i) => {
          const isOver = stat.value > stat.target;
          return (
            <div key={i} className={cn(
              "glass-card p-4 flex flex-col items-center text-center transition-all",
              isOver ? "border-red-500/50 bg-red-500/5" : ""
            )}>
              <stat.icon className={cn("mb-2", isOver ? "text-red-500" : stat.color)} size={20} />
              <p className={cn("text-2xl font-display font-bold", isOver ? "text-red-500" : "")}>
                {stat.value}<span className="text-xs text-brand-muted"> / {stat.target}{stat.label !== 'Calories' ? 'g' : ''}</span>
              </p>
              <p className="text-xs text-brand-muted uppercase tracking-wider font-bold">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Meal Sections */}
      <div className="space-y-4">
        {['breakfast', 'lunch', 'dinner', 'snack'].map((meal) => (
          <div key={meal} className="glass-card overflow-hidden">
            <div className="bg-white/5 px-6 py-3 border-bottom border-white/10 flex justify-between items-center">
              <h3 className="capitalize font-display font-bold text-lg">{meal}</h3>
              <span className="text-sm text-brand-muted">
                {logs.filter(l => l.meal_type === meal).reduce((sum, l) => sum + l.calories, 0)} kcal
              </span>
            </div>
            <div className="p-4 space-y-2">
              {logs.filter(l => l.meal_type === meal).map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 group transition-all">
                  <div>
                    <p className="font-medium">{item.food_name}</p>
                    <p className="text-xs text-brand-muted">P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold">{item.calories}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => {
                          setEditingFood(item);
                          setNewFood(item);
                          setShowAddModal(true);
                        }}
                        className="p-1 hover:text-brand-accent"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteFood(item.id!)}
                        className="p-1 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {logs.filter(l => l.meal_type === meal).length === 0 && (
                <p className="text-sm text-brand-muted italic text-center py-4">No entries yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Recipes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <ChefHat className="text-brand-accent" />
            AI Recipe Suggestions
          </h2>
          <button 
            onClick={() => generateAIRecipes(recipeCategory)}
            disabled={loadingRecipes}
            className="text-sm text-brand-accent hover:underline font-bold disabled:opacity-50"
          >
            {loadingRecipes ? 'Generating...' : 'Generate New'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recipes.map((recipe, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-lg leading-tight">{recipe.name}</h4>
                {recipe.isSnack && <span className="text-[10px] bg-brand-accent/20 text-brand-accent px-2 py-1 rounded-full font-bold uppercase">Snack</span>}
              </div>
              <p className="text-xs text-brand-muted mb-4 line-clamp-3">{recipe.instructions}</p>
              <div className="mt-auto pt-4 border-t border-white/10 flex justify-between text-[10px] font-bold text-brand-muted uppercase tracking-tighter">
                <span>P: {recipe.macros.p}g</span>
                <span>C: {recipe.macros.c}g</span>
                <span>F: {recipe.macros.f}g</span>
                <span className="text-brand-accent">{recipe.macros.cal} kcal</span>
              </div>
            </motion.div>
          ))}
          {recipes.length === 0 && !loadingRecipes && (
            <div className="col-span-full glass-card p-12 text-center">
              <ChefHat className="mx-auto text-brand-muted mb-4" size={48} />
              <p className="text-brand-muted">Hit generate to get personalized recipes matching your macros.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Food Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-md p-8"
          >
            <h2 className="text-2xl font-display font-bold mb-6">{editingFood ? 'Edit' : 'Add'} Food Entry</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-brand-muted">Meal Type</label>
                <select 
                  value={newFood.meal_type}
                  onChange={e => setNewFood({...newFood, meal_type: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-brand-muted">Food Name</label>
                <input 
                  value={newFood.food_name}
                  onChange={e => setNewFood({...newFood, food_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                  placeholder="e.g. Grilled Chicken"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-brand-muted">Calories</label>
                  <input 
                    type="number"
                    value={newFood.calories || ''}
                    onChange={e => setNewFood({...newFood, calories: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-brand-muted">Protein (g)</label>
                  <input 
                    type="number"
                    value={newFood.protein || ''}
                    onChange={e => setNewFood({...newFood, protein: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-brand-muted">Carbs (g)</label>
                  <input 
                    type="number"
                    value={newFood.carbs || ''}
                    onChange={e => setNewFood({...newFood, carbs: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-brand-muted">Fat (g)</label>
                  <input 
                    type="number"
                    value={newFood.fat || ''}
                    onChange={e => setNewFood({...newFood, fat: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddFood}
                className="flex-1 py-3 rounded-xl bg-brand-accent hover:bg-blue-600 text-white font-bold accent-glow transition-all"
              >
                Add Entry
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
