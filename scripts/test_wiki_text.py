import unittest
from wiki_text import sections,plain,lines

class SourceRegression(unittest.TestCase):
    def test_nested_preparation_once(self):
        source='==Ingredients==\n*100 g flour\n==Preparation==\n===Preparation of dough===\n#Mix flour.\n===Baking===\n#Bake.\n==Notes==\n*Tip\n'
        result=sections(source)
        self.assertEqual('\n'.join(result['instructions']).count('Mix flour.'),1)
        self.assertEqual('\n'.join(result['instructions']).count('Bake.'),1)
        self.assertNotIn('Tip','\n'.join(result['instructions']))
    def test_nested_ingredients_once(self):
        source='==Ingrédients==\n===Ingrédients de la pâte===\n*100 g de farine\n==Préparation==\n#Mélanger\n'
        self.assertEqual('\n'.join(sections(source)['ingredients']).count('100 g'),1)
    def test_recipe_container_does_not_become_method(self):
        source='==Recette==\n===Ingrédients===\n*100 g farine\n===Préparation===\n#Mélanger\n'
        self.assertNotIn('100 g','\n'.join(sections(source)['instructions']))
    def test_original_measurement_and_alias_preserved(self):
        self.assertEqual(plain('{{convert|375|F|C}} and {{i|fromage|tomme}}'),'375 F and tomme')
    def test_plain_preparation_heading(self):
        source='==Recette==\n===Ingrédients===\n*100 g farine\nPréparation\nMélanger.\n==Voir aussi==\n'
        self.assertNotIn('Mélanger','\n'.join(sections(source)['ingredients']))
        self.assertIn('Mélanger','\n'.join(sections(source)['instructions']))
    def test_la_recette_heading(self):
        self.assertIn('Mélanger','\n'.join(sections('==Ingrédients==\n*Farine\n==La recette==\n#Mélanger')['instructions']))
    def test_unresolved_quantity_visible_media_removed(self):
        self.assertIn('{{mystery|12}}',plain('{{mystery|12}} [[File:private.jpg|photo]]'))
        self.assertNotIn('private.jpg',plain('[[File:private.jpg|photo]]'))

if __name__=='__main__':unittest.main()
